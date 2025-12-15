#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from humanoid_nav_msgs.srv import PlanFootsteps, PlanFootstepsBetweenFeet
from geometry_msgs.msg import Pose2D
from humanoid_nav_msgs.msg import StepTarget
import sys

class FootstepPlannerClient(Node):
    def __init__(self):
        super().__init__('footstep_planner_client')
        self.plan_footsteps_client = self.create_client(PlanFootsteps, 'plan_footsteps')
        self.plan_footsteps_feet_client = self.create_client(PlanFootstepsBetweenFeet, 'plan_footsteps_feet')

    def call_plan_footsteps(self, start, goal):
        while not self.plan_footsteps_client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('service not available, waiting again...')
        request = PlanFootsteps.Request()
        request.start = start
        request.goal = goal
        future = self.plan_footsteps_client.call_async(request)
        rclpy.spin_until_future_complete(self, future)
        return future.result()

    def call_plan_footsteps_feet(self, start_left, start_right, goal_left, goal_right):
        while not self.plan_footsteps_feet_client.wait_for_service(timeout_sec=1.0):
            self.get_logger().info('service not available, waiting again...')
        request = PlanFootstepsBetweenFeet.Request()
        request.start_left = start_left
        request.start_right = start_right
        request.goal_left = goal_left
        request.goal_right = goal_right
        future = self.plan_footsteps_feet_client.call_async(request)
        rclpy.spin_until_future_complete(self, future)
        return future.result()

def main(args=None):
    rclpy.init(args=args)
    node = FootstepPlannerClient()

    if len(sys.argv) != 7 and len(sys.argv) != 13:
        sys.exit('\nUSAGE: %s <start> <goal>\n  where <start> and <goal> consist of "x y theta" in world coordinates\n\n' % sys.argv[0])

    if len(sys.argv) == 7:
        start = Pose2D()
        goal = Pose2D()

        start.x = float(sys.argv[1])
        start.y = float(sys.argv[2])
        start.theta = float(sys.argv[3])

        goal.x = float(sys.argv[4])
        goal.y = float(sys.argv[5])
        goal.theta = float(sys.argv[6])

        node.get_logger().info(f"Calling footstep planner service from ({start.x} {start.y} {start.theta}) to ({goal.x} {goal.y} {goal.theta})...")
        resp = node.call_plan_footsteps(start, goal)
    else:
        start_left = StepTarget()
        start_right = StepTarget()
        goal_left = StepTarget()
        goal_right = StepTarget()

        start_left.pose.x = float(sys.argv[1])
        start_left.pose.y = float(sys.argv[2])
        start_left.pose.theta = float(sys.argv[3])
        start_right.pose.x = float(sys.argv[4])
        start_right.pose.y = float(sys.argv[5])
        start_right.pose.theta = float(sys.argv[6])

        goal_left.pose.x = float(sys.argv[7])
        goal_left.pose.y = float(sys.argv[8])
        goal_left.pose.theta = float(sys.argv[9])
        goal_right.pose.x = float(sys.argv[10])
        goal_right.pose.y = float(sys.argv[11])
        goal_right.pose.theta = float(sys.argv[12])

        resp = node.call_plan_footsteps_feet(start_left, start_right, goal_left, goal_right)

    if resp.result:
        node.get_logger().info(f"Planning succeeded with {len(resp.footsteps)} steps, path costs: {resp.costs}")
        print("Footsteps:")
        for f in resp.footsteps:
            leg = "L" if f.leg == StepTarget.LEFT else "R"
            print(f"{leg} [{f.pose.x} {f.pose.y} {f.pose.theta}]")
    else:
        node.get_logger().error("Service call failed")

    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()