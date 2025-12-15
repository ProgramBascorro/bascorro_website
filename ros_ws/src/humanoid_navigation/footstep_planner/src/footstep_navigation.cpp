#include <footstep_planner/FootstepNavigation.h>
#include <rclcpp/rclcpp.hpp>

int main(int argc, char** argv)
{
  rclcpp::init(argc, argv);
  auto node = std::make_shared<footstep_planner::FootstepNavigation>();
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}