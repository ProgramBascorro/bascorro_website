#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from geometry_msgs.msg import PoseWithCovarianceStamped

class CorrectedInitialPose(Node):
    def __init__(self):
        super().__init__('corrected_initialpose')
        self.pub = self.create_publisher(PoseWithCovarianceStamped, 'nao_corrected_initialpose', 10)
        self.sub = self.create_subscription(PoseWithCovarianceStamped, 'initialpose', self.callback, 10)

    def callback(self, pose):
        newpose = pose
        newpose.pose.pose.position.z += 0.315
        self.pub.publish(newpose)

def main(args=None):
    rclpy.init(args=args)
    node = CorrectedInitialPose()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()