#include <footstep_planner/FootstepPlannerNode.h>
#include <rclcpp/rclcpp.hpp>

int main(int argc, char** argv)
{
  rclcpp::init(argc, argv);
  auto node = std::make_shared<footstep_planner::FootstepPlannerNode>();
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}