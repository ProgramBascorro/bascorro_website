#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from std_msgs.msg import String
from op3_online_walking_module_msgs.msg import Step2DArray, Step2D
from geometry_msgs.msg import Pose2D


class WalkingStepPlanner(Node):
    """
    Node ini:
      - subscribe  : /robotis/walking/command   (std_msgs/String)
      - publish    : /robotis/online_walking/footsteps_2d (Step2DArray)

    Bedanya versi ini:
      - "start"  -> aktifkan mode jalan kontinu (timer internal publish langkah tiap step_time)
      - "stop"   -> matikan mode jalan
    """

    def __init__(self):
        super().__init__('walking_step_planner')

        self.get_logger().info('✅ walking_step_planner node started')

        # Publisher Step2DArray
        self.step_pub = self.create_publisher(
            Step2DArray,
            '/robotis/online_walking/footsteps_2d',
            10
        )

        # Subscriber command walking dari GUI / node lain
        self.cmd_sub = self.create_subscription(
            String,
            '/robotis/walking/command',
            self.command_cb,
            10
        )

        # Parameter panjang langkah & waktu
        self.declare_parameter('step_time', 0.5)   # detik per langkah
        self.declare_parameter('step_x', 0.05)     # 5 cm per langkah maju
        self.declare_parameter('step_y', 0.02)     # 2 cm ke samping
        self.declare_parameter('step_theta', 0.1)  # ~5.7 derajat

        # State untuk mode jalan kontinu
        self.walking_active = False
        self.current_dx = 0.0
        self.current_dy = 0.0
        self.current_dtheta = 0.0
        self.current_foot = Step2D.LEFT_FOOT_SWING  # alternasi kaki kalau mau

        # Timer periodik: nanti kita pakai step_time sebagai periodenya
        step_time = self.get_parameter('step_time').get_parameter_value().double_value
        self.timer = self.create_timer(step_time, self.timer_cb)

    # ------------------------------------------------------------------ #
    # Callback command
    # ------------------------------------------------------------------ #
    def command_cb(self, msg: String):
        raw_cmd = msg.data
        cmd = raw_cmd.strip().lower()

        self.get_logger().info(
            f'📝 walking_step_planner: command = "{raw_cmd}" (normalized: "{cmd}")'
        )

        # Ambil parameter
        step_time = self.get_parameter('step_time').get_parameter_value().double_value
        step_x    = self.get_parameter('step_x').get_parameter_value().double_value
        step_y    = self.get_parameter('step_y').get_parameter_value().double_value
        step_th   = self.get_parameter('step_theta').get_parameter_value().double_value

        # ----- MODE JALAN KONTINU -----
        if cmd == 'start' or 'walk_forward' in cmd or 'forward' in cmd:
            # aktifkan mode jalan maju
            self.walking_active = True
            self.current_dx = step_x
            self.current_dy = 0.0
            self.current_dtheta = 0.0

            self.get_logger().info(
                f'▶️ START walking: dx={self.current_dx:.3f}, step_time={step_time:.2f}'
            )
            return

        if cmd == 'stop' or 'halt' in cmd:
            # matikan mode jalan
            self.walking_active = False
            self.get_logger().info('⏹️ STOP walking (walking_active = False)')
            return

        # ----- (Optional) Command lain kalau mau satu langkah saja -----
        if 'backward' in cmd:
            # satu langkah mundur (tanpa mode kontinu)
            self._publish_single_step(-step_x, 0.0, 0.0, step_time)
        elif 'turn_left' in cmd or ('turn' in cmd and 'left' in cmd):
            self._publish_single_step(0.0, 0.0, +step_th, step_time)
        elif 'turn_right' in cmd or ('turn' in cmd and 'right' in cmd):
            self._publish_single_step(0.0, 0.0, -step_th, step_time)
        else:
            self.get_logger().info(
                f'ℹ️ Command "{cmd}" tidak dipakai untuk langkah (diabaikan)'
            )

    # ------------------------------------------------------------------ #
    # Timer callback: publish langkah kalau walking_active = True
    # ------------------------------------------------------------------ #
    def timer_cb(self):
        if not self.walking_active:
            return

        step_time = self.get_parameter('step_time').get_parameter_value().double_value

        # publish langkah pakai current_dx/dy/dtheta
        self._publish_single_step(
            self.current_dx,
            self.current_dy,
            self.current_dtheta,
            step_time,
            use_current_foot=True
        )

    # ------------------------------------------------------------------ #
    # Helper: publish satu Step2DArray
    # ------------------------------------------------------------------ #
    def _publish_single_step(self, dx, dy, dtheta, step_time, use_current_foot=False):
        msg_step_array = Step2DArray()
        msg_step_array.step_time = step_time

        step_msg = Step2D()
        step_msg.step2d = Pose2D()
        step_msg.step2d.x = dx
        step_msg.step2d.y = dy
        step_msg.step2d.theta = dtheta

        if use_current_foot:
            step_msg.moving_foot = self.current_foot
            # toggle kaki untuk langkah berikutnya
            if self.current_foot == Step2D.LEFT_FOOT_SWING:
                self.current_foot = Step2D.RIGHT_FOOT_SWING
            else:
                self.current_foot = Step2D.LEFT_FOOT_SWING
        else:
            # default: kaki kiri
            step_msg.moving_foot = Step2D.LEFT_FOOT_SWING

        msg_step_array.footsteps_2d.append(step_msg)

        self.step_pub.publish(msg_step_array)

        self.get_logger().info(
            f'👣 Published footsteps_2d: '
            f'dx={dx:.3f}, dy={dy:.3f}, dtheta={dtheta:.3f}, step_time={step_time:.2f}'
        )


def main(args=None):
    rclpy.init(args=args)
    node = WalkingStepPlanner()
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
