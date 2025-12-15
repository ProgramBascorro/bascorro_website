#ifndef FOOTSTEP_PLANNER_FOOTSTEPPLANNERNODE_H_
#define FOOTSTEP_PLANNER_FOOTSTEPPLANNERNODE_H_

#include <rclcpp/rclcpp.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <footstep_planner/FootstepPlanner.h>

namespace footstep_planner
{
class FootstepPlannerNode : public rclcpp::Node
{
public:
  FootstepPlannerNode();
  virtual ~FootstepPlannerNode();

protected:
  FootstepPlanner ivFootstepPlanner;

  rclcpp::Subscription<geometry_msgs::msg::PoseStamped>::SharedPtr ivGoalPoseSub;
  rclcpp::Subscription<nav_msgs::msg::OccupancyGrid>::SharedPtr ivGridMapSub;
  rclcpp::Subscription<geometry_msgs::msg::PoseWithCovarianceStamped>::SharedPtr ivStartPoseSub;
  rclcpp::Subscription<geometry_msgs::msg::PoseStamped>::SharedPtr ivRobotPoseSub;

  rclcpp::Service<humanoid_nav_msgs::srv::PlanFootsteps>::SharedPtr ivFootstepPlanService;
  rclcpp::Service<humanoid_nav_msgs::srv::PlanFootstepsBetweenFeet>::SharedPtr ivFootstepPlanFeetService;
};
}

#endif  // FOOTSTEP_PLANNER_FOOTSTEPPLANNERNODE_H_