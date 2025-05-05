#include <rclcpp/rclcpp.hpp>
#include <humanoid_planner_2d/SBPLPlanner2D.h>

class SBPLPlanner2DNode : public rclcpp::Node {
public:
  SBPLPlanner2DNode() : Node("sbpl_planner_2d_node") {
    map_sub_ = this->create_subscription<nav_msgs::msg::OccupancyGrid>(
      "map", 1, std::bind(&SBPLPlanner2D::mapCallback, &planner_, std::placeholders::_1));
    goal_sub_ = this->create_subscription<geometry_msgs::msg::PoseStamped>(
      "goal", 1, std::bind(&SBPLPlanner2D::goalCallback, &planner_, std::placeholders::_1));
    start_sub_ = this->create_subscription<geometry_msgs::msg::PoseWithCovarianceStamped>(
      "initialpose", 1, std::bind(&SBPLPlanner2D::startCallback, &planner_, std::placeholders::_1));
  }

  virtual ~SBPLPlanner2DNode() {}

protected:
  SBPLPlanner2D planner_;
  rclcpp::Subscription<nav_msgs::msg::OccupancyGrid>::SharedPtr map_sub_;
  rclcpp::Subscription<geometry_msgs::msg::PoseStamped>::SharedPtr goal_sub_;
  rclcpp::Subscription<geometry_msgs::msg::PoseWithCovarianceStamped>::SharedPtr start_sub_;
};

int main(int argc, char** argv) {
  rclcpp::init(argc, argv);
  auto node = std::make_shared<SBPLPlanner2DNode>();
  rclcpp::spin(node);
  rclcpp::shutdown();
  return 0;
}