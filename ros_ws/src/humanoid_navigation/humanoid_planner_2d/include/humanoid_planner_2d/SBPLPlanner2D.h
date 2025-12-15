#ifndef HUMANOID_PLANNER_2D_SBPL_2D_PLANNER_
#define HUMANOID_PLANNER_2D_SBPL_2D_PLANNER_

#include <rclcpp/rclcpp.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <nav_msgs/msg/occupancy_grid.hpp>
#include <nav_msgs/msg/path.hpp>
#include <visualization_msgs/msg/marker.hpp>
#include "gridmap_2d/GridMap2D.h"
#include <sbpl/headers.h>

class SBPLPlanner2D : public rclcpp::Node {
public:
  SBPLPlanner2D();
  virtual ~SBPLPlanner2D();

  void goalCallback(const geometry_msgs::msg::PoseStamped::SharedPtr goal);
  void startCallback(const geometry_msgs::msg::PoseWithCovarianceStamped::SharedPtr start);
  void mapCallback(const nav_msgs::msg::OccupancyGrid::SharedPtr map);

  bool plan(const geometry_msgs::msg::Pose& start, const geometry_msgs::msg::Pose& goal);
  bool plan(double startX, double startY, double goalX, double goalY);

  inline double getPathCosts() const { return path_costs_; }
  inline const nav_msgs::msg::Path& getPath() const { return path_; }
  inline double getRobotRadius() const { return robot_radius_; }

protected:
  bool plan();
  void setPlanner();
  bool updateMap(gridmap_2d::GridMap2DPtr map);

  rclcpp::Subscription<geometry_msgs::msg::PoseStamped>::SharedPtr goal_sub_;
  rclcpp::Subscription<geometry_msgs::msg::PoseWithCovarianceStamped>::SharedPtr start_sub_;
  rclcpp::Subscription<nav_msgs::msg::OccupancyGrid>::SharedPtr map_sub_;
  rclcpp::Publisher<nav_msgs::msg::Path>::SharedPtr path_pub_;

  std::shared_ptr<SBPLPlanner> planner_;
  std::shared_ptr<EnvironmentNAV2D> planner_environment_;
  gridmap_2d::GridMap2DPtr map_;

  std::string planner_type_;
  double allocated_time_;
  double initial_epsilon_;
  bool search_until_first_solution_;
  bool forward_search_;
  double robot_radius_;

  bool start_received_, goal_received_;
  geometry_msgs::msg::Pose start_pose_, goal_pose_;
  nav_msgs::msg::Path path_;
  double path_costs_;

  static const unsigned char OBSTACLE_COST = 20;
};

#endif /* HUMANOID_PLANNER_2D_SBPL_2D_PLANNER_ */