#!/usr/bin/env python3
import math
import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry
from sensor_msgs.msg import Imu
from std_msgs.msg import String
from op3_online_walking_module_msgs.msg import Step2DArray
from geometry_msgs.msg import TransformStamped, Quaternion

try:
    from tf_transformations import euler_from_quaternion, quaternion_from_euler
except Exception:
    import tf_transformations as tft
    euler_from_quaternion = tft.euler_from_quaternion
    quaternion_from_euler = tft.quaternion_from_euler

from tf2_ros import TransformBroadcaster


def yaw_from_quat(q):
    try:
        _, _, yaw = euler_from_quaternion([q.x, q.y, q.z, q.w])
        return yaw
    except Exception:
        return 0.0


def quat_from_yaw(yaw):
    q = quaternion_from_euler(0.0, 0.0, yaw)
    return Quaternion(x=q[0], y=q[1], z=q[2], w=q[3])


class WalkingImuOdometry(Node):
    def __init__(self):
        super().__init__('walking_imu_odometry')

        self.get_logger().info('✅ walking_imu_odometry node started')

        # pose & yaw
        self.x = 0.0
        self.y = 0.0
        self.yaw = 0.0

        # IMU data
        self.imu_quat = None
        self.imu_ang_z = 0.0
        self.got_imu = False

        # flags
        self.got_step = False

        # publishers
        self.odom_pub = self.create_publisher(Odometry, 'odom', 10)
        self.tf_broadcaster = TransformBroadcaster(self)

        # === SUBSCRIBERS ===

        # 1) IMU dari Webots / robot
        self.create_subscription(
            Imu,
            '/robotis_op3/imu',
            self.imu_cb,
            50
        )

        # 2) Langkah "ideal" dari online walking (kalau ada)
        self.create_subscription(
            Step2DArray,
            '/robotis/online_walking/footsteps_2d',
            self.step_cb,
            10
        )

        # 3) Perintah walking dari GUI (String)
        self.create_subscription(
            String,
            '/robotis/walking/command',
            self.walking_command_cb,
            10
        )

    # ---------- Callbacks ----------

    def imu_cb(self, msg: Imu):
        if not self.got_imu:
            self.get_logger().info('📡 First IMU message received from /robotis_op3/imu')
            self.got_imu = True

        self.imu_quat = msg.orientation
        self.imu_ang_z = msg.angular_velocity.z

        try:
            self.yaw = yaw_from_quat(self.imu_quat)
        except Exception:
            pass

    def step_cb(self, msg: Step2DArray):
        # Dipanggil kalau ada node yang publish footsteps_2d
        if not self.got_step:
            self.get_logger().info(
                f'👣 First footsteps_2d received: {len(msg.footsteps_2d)} steps'
            )
            self.got_step = True

        total_dx = 0.0
        total_dy = 0.0
        total_dtheta = 0.0

        for s in msg.footsteps_2d:
            total_dx += float(s.step2d.x)
            total_dy += float(s.step2d.y)
            total_dtheta += float(s.step2d.theta)

        step_dt = float(msg.step_time) if msg.step_time > 0.0 else 0.5
        self._integrate_and_publish(total_dx, total_dy, total_dtheta, step_dt)

    def walking_command_cb(self, msg: String):
        """
        Dipanggil tiap kali GUI kirim command ke /robotis/walking/command.
        Di sini kita terjemahkan string -> langkah kira-kira.
        """
        cmd_raw = msg.data
        cmd = cmd_raw.lower().strip()
        self.get_logger().info(f'📝 walking_command_cb: "{cmd_raw}" (normalized: "{cmd}")')

        # --- Mapping sederhana command -> langkah ---
        step_dt = 0.5  # asumsikan 0.5 detik per command

        dx = 0.0
        dy = 0.0
        dtheta = 0.0

        # beberapa contoh nama command yang mungkin:
        # "walk_forward", "forward", "start_forward", dll.
        if "forward" in cmd or "walk_forward" in cmd or cmd == "w":
            dx = 0.05   # 5 cm per command
        elif "backward" in cmd or "back" in cmd or cmd == "s":
            dx = -0.05
        elif ("left" in cmd and "turn" not in cmd) and cmd not in ["left_turn"]:
            dy = 0.02   # geser kiri
        elif ("right" in cmd and "turn" not in cmd) and cmd not in ["right_turn"]:
            dy = -0.02  # geser kanan
        elif "turn_left" in cmd or ("turn" in cmd and "left" in cmd) or cmd in ["left_turn", "q"]:
            dtheta = +0.1  # ~5.7 deg
        elif "turn_right" in cmd or ("turn" in cmd and "right" in cmd) or cmd in ["right_turn", "e"]:
            dtheta = -0.1
        elif cmd in ["stop", "halt", "init", "init_pose", "stand", "sit"]:
            # perintah postur / stop → tidak menggeser odom
            self.get_logger().info(f'⏹️ Command "{cmd}" tidak mengubah odom')
            return
        else:
            # fallback: kalau command tidak dikenali tapi bukan stop,
            # anggap 1 langkah maju kecil supaya odom tetap bergerak.
            self.get_logger().info(
                f'ℹ️ Command "{cmd}" tidak dikenali, anggap 1 langkah maju kecil untuk odom'
            )
            dx = 0.03

        self._integrate_and_publish(dx, dy, dtheta, step_dt)

    # ---------- Core integration ----------

    def _integrate_and_publish(self, total_dx, total_dy, total_dtheta, step_dt):
        now = self.get_clock().now().to_msg()

        # rotate into world using current yaw
        yaw = self.yaw
        dx_world = math.cos(yaw) * total_dx - math.sin(yaw) * total_dy
        dy_world = math.sin(yaw) * total_dx + math.cos(yaw) * total_dy

        # integrate pose
        self.x += dx_world
        self.y += dy_world
        self.yaw += total_dtheta

        # velocities
        vx = dx_world / step_dt if step_dt > 0.0 else 0.0
        vy = dy_world / step_dt if step_dt > 0.0 else 0.0
        wz = total_dtheta / step_dt if abs(total_dtheta) > 1e-6 else self.imu_ang_z

        # Odometry message
        odom = Odometry()
        odom.header.stamp = now
        odom.header.frame_id = 'odom'
        odom.child_frame_id = 'base_link'

        odom.pose.pose.position.x = self.x
        odom.pose.pose.position.y = self.y
        odom.pose.pose.position.z = 0.0

        if self.imu_quat is not None:
            odom.pose.pose.orientation = self.imu_quat
        else:
            odom.pose.pose.orientation = quat_from_yaw(self.yaw)

        odom.twist.twist.linear.x = vx
        odom.twist.twist.linear.y = vy
        odom.twist.twist.linear.z = 0.0
        odom.twist.twist.angular.z = wz

        # covariance 6x6 = 36 elemen
        odom.pose.covariance = [0.0] * 36
        odom.twist.covariance = [0.0] * 36

        self.odom_pub.publish(odom)

        # TF odom -> base_link
        t = TransformStamped()
        t.header.stamp = now
        t.header.frame_id = 'odom'
        t.child_frame_id = 'base_link'
        t.transform.translation.x = self.x
        t.transform.translation.y = self.y
        t.transform.translation.z = 0.0
        if self.imu_quat is not None:
            t.transform.rotation = self.imu_quat
        else:
            t.transform.rotation = quat_from_yaw(self.yaw)
        self.tf_broadcaster.sendTransform(t)

        self.get_logger().info(
            f'📨 Odom updated: x={self.x:.3f}, y={self.y:.3f}, yaw={self.yaw:.3f}'
        )


def main(args=None):
    rclpy.init(args=args)
    node = WalkingImuOdometry()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        try:
            node.destroy_node()
        except Exception:
            pass
        try:
            rclpy.shutdown()
        except Exception:
            pass


if __name__ == '__main__':
    main()
