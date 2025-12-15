#!/usr/bin/env python3
"""Soccer vision pipeline using lightweight CV + optional YOLO fallback."""

from math import atan2, cos, radians, sin, tan
from pathlib import Path
from typing import List, Optional, Tuple

import cv2
import numpy as np
import rclpy
from cv_bridge import CvBridge, CvBridgeError
from geometry_msgs.msg import Point, PointStamped, Pose, PoseArray, Quaternion
from op3_ball_detector_msgs.msg import CircleSetStamped
from rclpy.node import Node
from sensor_msgs.msg import Image


class SoccerVisionNode(Node):
    """Publish ball detections + field landmarks for localization."""

    def __init__(self) -> None:
        super().__init__('soccer_vision_node')

        self.bridge = CvBridge()
        self.detections_sent = 0
        self.field_lines_sent = 0
        self.goal_posts_sent = 0
        self.yolo_model = None

        self.declare_parameter('image_topic', '/robotis_op3/camera/image_raw')
        self.declare_parameter('publish_topic', '/ball_detector_node/circle_set')
        self.declare_parameter('model_path', '')
        self.declare_parameter('confidence_threshold', 0.4)
        self.declare_parameter('use_dummy_detections', True)
        self.declare_parameter('dummy_radius', 0.18)
        self.declare_parameter('enable_ball_detection', True)
        self.declare_parameter('enable_field_landmarks', True)
        self.declare_parameter('camera_height', 0.47)  # meters
        self.declare_parameter('camera_pitch_deg', -18.0)
        self.declare_parameter('hfov_deg', 62.0)
        self.declare_parameter('vfov_deg', 36.0)
        self.declare_parameter('output_frame', 'base_link')
        self.declare_parameter('publish_debug_image', False)
        self.declare_parameter('debug_image_topic', '/soccer_vision/debug_image')

        self.image_topic = self.get_parameter('image_topic').get_parameter_value().string_value
        self.publish_topic = self.get_parameter('publish_topic').get_parameter_value().string_value
        self.model_path = self.get_parameter('model_path').get_parameter_value().string_value
        self.confidence_threshold = self.get_parameter('confidence_threshold').get_parameter_value().double_value
        self.use_dummy_detections = self.get_parameter('use_dummy_detections').get_parameter_value().bool_value
        self.dummy_radius = self.get_parameter('dummy_radius').get_parameter_value().double_value
        self.enable_ball_detection = self.get_parameter('enable_ball_detection').get_parameter_value().bool_value
        self.enable_field_landmarks = self.get_parameter('enable_field_landmarks').get_parameter_value().bool_value
        self.camera_height = self.get_parameter('camera_height').get_parameter_value().double_value
        self.camera_pitch = radians(
            self.get_parameter('camera_pitch_deg').get_parameter_value().double_value
        )
        self.hfov = radians(self.get_parameter('hfov_deg').get_parameter_value().double_value)
        self.vfov = radians(self.get_parameter('vfov_deg').get_parameter_value().double_value)
        self.output_frame = self.get_parameter('output_frame').get_parameter_value().string_value
        self.publish_debug_image = self.get_parameter('publish_debug_image').get_parameter_value().bool_value
        self.debug_image_topic = self.get_parameter('debug_image_topic').get_parameter_value().string_value

        self.ball_pub = self.create_publisher(CircleSetStamped, self.publish_topic, 10)
        self.field_line_pub = self.create_publisher(PoseArray, '/soccer_vision/field_lines', 10)
        self.center_circle_pub = self.create_publisher(PointStamped, '/soccer_vision/center_circle', 10)
        self.goal_post_pub = self.create_publisher(PoseArray, '/soccer_vision/goal_posts', 10)

        self.subscription = self.create_subscription(Image, self.image_topic, self.image_callback, 10)
        self.debug_image_pub = (
            self.create_publisher(Image, self.debug_image_topic, 1) if self.publish_debug_image else None
        )
        self.status_timer = self.create_timer(15.0, self._log_status)

        if self.enable_ball_detection and not self.use_dummy_detections:
            self._load_yolo_model(self.model_path)

        mode = 'dummy' if self.use_dummy_detections else 'yolo'
        self.get_logger().info(
            f'Soccer vision initialized | mode={mode} | ball={self.enable_ball_detection} | field={self.enable_field_landmarks}'
        )

    # ------------------------------------------------------------------
    # ROS Callbacks
    # ------------------------------------------------------------------
    def image_callback(self, msg: Image) -> None:
        try:
            frame = self.bridge.imgmsg_to_cv2(msg, desired_encoding='bgr8')
        except CvBridgeError as exc:
            self.get_logger().error(f'Failed to convert image: {exc}')
            return

        height, width = frame.shape[:2]
        overlay = frame.copy() if self.publish_debug_image else None
        field_mask, white_mask, orange_mask = self._preprocess_masks(frame)

        if self.enable_ball_detection:
            ball_detections = self._detect_ball(frame, orange_mask, overlay)
            if ball_detections:
                circle_msg = CircleSetStamped()
                circle_msg.header = msg.header
                circle_msg.circles = ball_detections
                self.ball_pub.publish(circle_msg)
                self.detections_sent += 1

        if self.enable_field_landmarks:
            self._publish_field_lines(msg.header.stamp, width, height, white_mask, field_mask, overlay)
            self._publish_center_circle(msg.header.stamp, width, height, white_mask, field_mask, overlay)
            self._publish_goal_posts(msg.header.stamp, width, height, white_mask, overlay)

        if overlay is not None and self.debug_image_pub is not None:
            debug_msg = self.bridge.cv2_to_imgmsg(overlay, encoding='bgr8')
            debug_msg.header = msg.header
            self.debug_image_pub.publish(debug_msg)

    def _log_status(self) -> None:
        self.get_logger().info(
            'Soccer vision alive | dummy=%s | balls=%d | field_lines=%d | goal_posts=%d'
            % (self.use_dummy_detections, self.detections_sent, self.field_lines_sent, self.goal_posts_sent)
        )

    # ------------------------------------------------------------------
    # Pre-processing
    # ------------------------------------------------------------------
    def _preprocess_masks(self, frame: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        blurred = cv2.GaussianBlur(frame, (5, 5), 0)
        hsv = cv2.cvtColor(blurred, cv2.COLOR_BGR2HSV)

        field_mask = cv2.inRange(hsv, (35, 40, 40), (90, 255, 255))
        white_mask = cv2.inRange(hsv, (0, 0, 190), (180, 80, 255))
        orange_mask = cv2.inRange(hsv, (5, 120, 80), (30, 255, 255))

        return field_mask, white_mask, orange_mask

    # ------------------------------------------------------------------
    # Ball detection helpers
    # ------------------------------------------------------------------
    def _detect_ball(self, frame: np.ndarray, orange_mask: np.ndarray, overlay: Optional[np.ndarray]) -> List[Point]:
        if frame is None:
            return []

        if not self.use_dummy_detections and self.yolo_model is not None:
            detections = self._run_yolo(frame)
            if detections:
                if overlay is not None:
                    for pt in detections:
                        cx = int(((pt.x + 1.0) / 2.0) * frame.shape[1])
                        cy = int(((pt.y + 1.0) / 2.0) * frame.shape[0])
                        radius = int(pt.z * max(frame.shape[:2]))
                        cv2.circle(overlay, (cx, cy), max(radius, 6), (0, 140, 255), 2)
                return detections

        mask = cv2.morphologyEx(orange_mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=2)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        height, width = frame.shape[:2]
        if not contours:
            return self._dummy_detection(width, height, overlay) if self.use_dummy_detections else []

        largest = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest)
        if area < 30:
            return self._dummy_detection(width, height, overlay) if self.use_dummy_detections else []

        (cx, cy), radius = cv2.minEnclosingCircle(largest)
        norm_radius = radius / max(width, height)
        if overlay is not None:
            cv2.circle(overlay, (int(cx), int(cy)), int(radius), (0, 140, 255), 2)
            cv2.circle(overlay, (int(cx), int(cy)), 3, (0, 140, 255), -1)
        return [self._point_from_pixel(cx, cy, width, height, norm_radius)]

    def _dummy_detection(self, width: int, height: int, overlay: Optional[np.ndarray]) -> List[Point]:
        point = self._point_from_pixel(width / 2.0, height * 0.65, width, height, self.dummy_radius)
        if overlay is not None:
            cx = int(width / 2.0)
            cy = int(height * 0.65)
            radius = int(self.dummy_radius * max(width, height))
            cv2.circle(overlay, (cx, cy), max(radius, 8), (255, 255, 0), 1, lineType=cv2.LINE_AA)
            cv2.drawMarker(overlay, (cx, cy), (255, 255, 0), markerType=cv2.MARKER_CROSS, markerSize=8, thickness=1)
        return [point]

    def _run_yolo(self, frame: np.ndarray) -> List[Point]:
        detections: List[Point] = []
        if self.yolo_model is None:
            return detections

        try:
            results = self.yolo_model.predict(frame, verbose=False)
        except Exception as exc:  # pragma: no cover - depends on external lib
            self.get_logger().error(f'YOLO inference failed: {exc}')
            return detections

        if not results:
            return detections

        result = results[0]
        boxes = getattr(result, 'boxes', None)
        if boxes is None:
            return detections

        try:
            xywh = boxes.xywh.cpu().numpy()
            conf = boxes.conf.cpu().numpy()
        except Exception as exc:  # pragma: no cover
            self.get_logger().error(f'Failed to read YOLO tensors: {exc}')
            return detections

        height, width = frame.shape[:2]
        for idx, box in enumerate(xywh):
            if idx >= len(conf):
                break
            if conf[idx] < self.confidence_threshold:
                continue

            cx, cy, w, h = box
            norm_radius = max(w, h) / max(width, height)
            detections.append(self._point_from_pixel(cx, cy, width, height, norm_radius))

        return detections

    def _point_from_pixel(self, cx: float, cy: float, width: int, height: int, normalized_radius: float) -> Point:
        point = Point()
        point.x = float((cx / width) * 2.0 - 1.0)
        point.y = float((cy / height) * 2.0 - 1.0)
        point.z = float(np.clip(normalized_radius, 0.0, 1.0))
        return point

    # ------------------------------------------------------------------
    # Field landmark helpers
    # ------------------------------------------------------------------
    def _publish_field_lines(
        self,
        stamp,
        width: int,
        height: int,
        white_mask: np.ndarray,
        field_mask: np.ndarray,
        overlay: Optional[np.ndarray],
    ) -> None:
        mask = cv2.bitwise_and(white_mask, white_mask, mask=field_mask)
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

        if cv2.countNonZero(mask) < 50:
            return

        edges = cv2.Canny(mask, 60, 140)
        lines = cv2.HoughLinesP(
            edges,
            rho=1,
            theta=np.pi / 180,
            threshold=60,
            minLineLength=int(width * 0.2),
            maxLineGap=25,
        )

        if lines is None:
            return

        pose_array = PoseArray()
        pose_array.header.stamp = stamp
        pose_array.header.frame_id = self.output_frame

        for line in lines[:8]:  # limit noise
            x1, y1, x2, y2 = line[0]
            if overlay is not None:
                cv2.line(overlay, (x1, y1), (x2, y2), (255, 0, 0), 2, lineType=cv2.LINE_AA)
            start = self._project_pixel_to_ground(x1, y1, width, height)
            end = self._project_pixel_to_ground(x2, y2, width, height)
            if start is None or end is None:
                continue

            pose = Pose()
            pose.position.x = (start[0] + end[0]) / 2.0
            pose.position.y = (start[1] + end[1]) / 2.0
            pose.position.z = 0.0
            yaw = atan2(end[1] - start[1], end[0] - start[0])
            pose.orientation = self._quat_from_yaw(yaw)
            pose_array.poses.append(pose)

        if pose_array.poses:
            self.field_line_pub.publish(pose_array)
            self.field_lines_sent += 1

    def _publish_center_circle(
        self,
        stamp,
        width: int,
        height: int,
        white_mask: np.ndarray,
        field_mask: np.ndarray,
        overlay: Optional[np.ndarray],
    ) -> None:
        mask = cv2.bitwise_and(white_mask, white_mask, mask=field_mask)
        mask = cv2.GaussianBlur(mask, (7, 7), 0)

        circles = cv2.HoughCircles(
            mask,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=height * 0.4,
            param1=120,
            param2=18,
            minRadius=int(height * 0.06),
            maxRadius=int(height * 0.25),
        )

        if circles is None:
            return

        cx, cy, radius = circles[0][0]
        if overlay is not None:
            cv2.circle(overlay, (int(cx), int(cy)), int(radius), (0, 255, 255), 2, lineType=cv2.LINE_AA)
        ground_pt = self._project_pixel_to_ground(cx, cy, width, height)
        if ground_pt is None:
            return

        msg = PointStamped()
        msg.header.stamp = stamp
        msg.header.frame_id = self.output_frame
        msg.point.x = float(ground_pt[0])
        msg.point.y = float(ground_pt[1])
        msg.point.z = 0.0
        self.center_circle_pub.publish(msg)

    def _publish_goal_posts(
        self,
        stamp,
        width: int,
        height: int,
        white_mask: np.ndarray,
        overlay: Optional[np.ndarray],
    ) -> None:
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(white_mask, cv2.MORPH_CLOSE, kernel, iterations=1)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            return

        pose_array = PoseArray()
        pose_array.header.stamp = stamp
        pose_array.header.frame_id = self.output_frame

        for contour in sorted(contours, key=cv2.contourArea, reverse=True)[:6]:
            x, y, w, h = cv2.boundingRect(contour)
            if h < height * 0.05 or w > h * 1.5:
                continue
            if y > height * 0.7:
                continue

            center_x = x + w / 2.0
            center_y = y + h / 2.0
            ground_pt = self._project_pixel_to_ground(center_x, center_y, width, height)
            if ground_pt is None:
                continue

            if overlay is not None:
                cv2.rectangle(overlay, (x, y), (x + w, y + h), (0, 0, 255), 2)

            pose = Pose()
            pose.position.x = float(ground_pt[0])
            pose.position.y = float(ground_pt[1])
            pose.position.z = 0.0
            pose.orientation = self._quat_from_yaw(0.0)
            pose_array.poses.append(pose)

        if pose_array.poses:
            self.goal_post_pub.publish(pose_array)
            self.goal_posts_sent += 1

    def _project_pixel_to_ground(self, px: float, py: float, width: int, height: int) -> Optional[Tuple[float, float, float]]:
        x_norm = (px / width) * 2.0 - 1.0
        y_norm = (py / height) * 2.0 - 1.0

        bearing = x_norm * (self.hfov / 2.0)
        vertical_angle = self.camera_pitch + y_norm * (self.vfov / 2.0)

        if vertical_angle >= -0.05:
            return None

        distance = self.camera_height / tan(-vertical_angle)
        x = distance * cos(bearing)
        y = distance * sin(bearing)
        return (x, y, bearing)

    def _quat_from_yaw(self, yaw: float) -> Quaternion:
        q = Quaternion()
        q.z = sin(yaw / 2.0)
        q.w = cos(yaw / 2.0)
        return q

    # ------------------------------------------------------------------
    # YOLO helpers
    # ------------------------------------------------------------------
    def _load_yolo_model(self, model_path: str) -> None:
        path = Path(model_path)
        if not model_path:
            self.get_logger().warning('No YOLO weights provided. Falling back to dummy detections.')
            self.use_dummy_detections = True
            return
        if not path.exists():
            self.get_logger().warning(f'YOLO weights not found at {path}. Using dummy detections instead.')
            self.use_dummy_detections = True
            return

        try:
            from ultralytics import YOLO  # type: ignore
        except ImportError:
            self.get_logger().warning('ultralytics is not installed. Run `pip install ultralytics` to enable YOLO. Using dummy detections.')
            self.use_dummy_detections = True
            return

        try:
            self.yolo_model = YOLO(str(path))
            self.get_logger().info(f'Loaded YOLO weights from {path}')
        except Exception as exc:  # pragma: no cover
            self.get_logger().error(f'Failed to load YOLO weights: {exc}')
            self.use_dummy_detections = True


def main() -> None:
    rclpy.init()
    node = SoccerVisionNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
