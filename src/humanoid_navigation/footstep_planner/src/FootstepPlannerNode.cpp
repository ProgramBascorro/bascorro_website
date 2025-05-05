#include <footstep_planner/FootstepPlannerNode.h>
#include <rclcpp/rclcpp.hpp>
#include <nav_msgs/msg/occupancy_grid.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <humanoid_nav_msgs/srv/plan_footsteps.hpp>
#include <humanoid_nav_msgs/srv/plan_footsteps_between_feet.hpp>

namespace footstep_planner
{
FootstepPlannerNode::FootstepPlannerNode()
: Node("footstep_planner_node")
{
  ivGridMapSub = this->create_subscription<nav_msgs::msg::OccupancyGrid>(
    "map", 1, std::bind(&FootstepPlanner::mapCallback, &ivFootstepPlanner, std::placeholders::_1));
  ivGoalPoseSub = this->create_subscription<geometry_msgs::msg::PoseStamped>(
    "goal", 1, std::bind(&FootstepPlanner::goalPoseCallback, &ivFootstepPlanner, std::placeholders::_1));
  ivStartPoseSub = this->create_subscription<geometry_msgs::msg::PoseWithCovarianceStamped>(
    "initialpose", 1, std::bind(&FootstepPlanner::startPoseCallback, &ivFootstepPlanner, std::placeholders::_1));

  ivFootstepPlanService = this->create_service<humanoid_nav_msgs::srv::PlanFootsteps>(
    "plan_footsteps", std::bind(&FootstepPlanner::planService, &ivFootstepPlanner, std::placeholders::_1, std::placeholders::_2));
  ivFootstepPlanFeetService = this->create_service<humanoid_nav_msgs::srv::PlanFootstepsBetweenFeet>(
    "plan_footsteps_feet", std::bind(&FootstepPlanner::planFeetService, &ivFootstepPlanner, std::placeholders::_1, std::placeholders::_2));
}

FootstepPlannerNode::~FootstepPlannerNode()
{}
}