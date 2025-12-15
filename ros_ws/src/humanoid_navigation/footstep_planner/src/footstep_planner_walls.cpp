#include <rclcpp/rclcpp.hpp>
#include <footstep_planner/FootstepPlanner.h>
#include <nav_msgs/msg/occupancy_grid.hpp>
#include <gridmap_2d/GridMap2D.h>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <opencv2/opencv.hpp>

using namespace footstep_planner;
using gridmap_2d::GridMap2D;
using gridmap_2d::GridMap2DPtr;

class FootstepPlannerWallsNode : public rclcpp::Node {
public:
  FootstepPlannerWallsNode()
  : Node("footstep_planner_walls_node")
  {
    this->declare_parameter("footstep_wall_dist", 0.15);
    this->get_parameter("footstep_wall_dist", ivFootstepWallDist);

    ivGridMapSub = this->create_subscription<nav_msgs::msg::OccupancyGrid>(
      "map", 1, std::bind(&FootstepPlannerWallsNode::mapCallback, this, std::placeholders::_1));
    ivGoalPoseSub = this->create_subscription<geometry_msgs::msg::PoseStamped>(
      "goal", 1, std::bind(&FootstepPlanner::goalPoseCallback, &ivFootstepPlanner, std::placeholders::_1));
    ivStartPoseSub = this->create_subscription<geometry_msgs::msg::PoseWithCovarianceStamped>(
      "initialpose", 1, std::bind(&FootstepPlanner::startPoseCallback, &ivFootstepPlanner, std::placeholders::_1));

    ivFootstepPlanService = this->create_service<humanoid_nav_msgs::srv::PlanFootsteps>(
      "plan_footsteps", std::bind(&FootstepPlanner::planService, &ivFootstepPlanner, std::placeholders::_1, std::placeholders::_2));
  }

  virtual ~FootstepPlannerWallsNode() {}

  void mapCallback(const nav_msgs::msg::OccupancyGrid::SharedPtr occupancyMap)
  {
    RCLCPP_INFO(this->get_logger(), "Obstacle map received, now waiting for wall map.");
    ivGridMap = std::make_shared<GridMap2D>(occupancyMap);

    ivWallMapSub = this->create_subscription<nav_msgs::msg::OccupancyGrid>(
      "map_walls", 1, std::bind(&FootstepPlannerWallsNode::wallMapCallback, this, std::placeholders::_1));
  }

  void wallMapCallback(const nav_msgs::msg::OccupancyGrid::SharedPtr occupancyMap)
  {
    RCLCPP_INFO(this->get_logger(), "Wall / Obstacle map received");
    assert(ivGridMap);
    GridMap2DPtr wallMap = std::make_shared<GridMap2D>(occupancyMap);

    GridMap2DPtr enlargedWallMap = std::make_shared<GridMap2D>(occupancyMap);
    cv::Mat binaryMap = (enlargedWallMap->distanceMap() > ivFootstepWallDist);
    cv::bitwise_and(binaryMap, ivGridMap->binaryMap(), binaryMap);

    enlargedWallMap->setMap(binaryMap);

    ivFootstepPlanner.updateMap(enlargedWallMap);
  }

protected:
  footstep_planner::FootstepPlanner ivFootstepPlanner;
  GridMap2DPtr ivGridMap;
  double ivFootstepWallDist;
  // rclcpp::Subscription<nav_msgs::msg::OccupancyGrid>::SharedPtr ivGoalPoseSub, ivGridMapSub, ivWallMapSub, ivStartPoseSub;
  rclcpp::Subscription<nav_msgs::msg::OccupancyGrid>::SharedPtr ivGridMapSub;
  rclcpp::Subscription<nav_msgs::msg::OccupancyGrid>::SharedPtr ivWallMapSub;
  rclcpp::Subscription<geometry_msgs::msg::PoseStamped>::SharedPtr ivGoalPoseSub;
  rclcpp::Subscription<geometry_msgs::msg::PoseWithCovarianceStamped>::SharedPtr ivStartPoseSub;
  rclcpp::Service<humanoid_nav_msgs::srv::PlanFootsteps>::SharedPtr ivFootstepPlanService;
};

int main(int argc, char** argv)
{
  rclcpp::init(argc, argv);
  auto node = std::make_shared<FootstepPlannerWallsNode>();
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}