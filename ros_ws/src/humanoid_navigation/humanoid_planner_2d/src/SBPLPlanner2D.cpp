#include "humanoid_planner_2d/SBPLPlanner2D.h"

SBPLPlanner2D::SBPLPlanner2D()
  : Node("sbpl_planner_2d"),
    robot_radius_(0.25),
    start_received_(false), goal_received_(false),
    path_costs_(0.0)
{
  this->declare_parameter<std::string>("planner_type", "ARAPlanner");
  this->declare_parameter<bool>("search_until_first_solution", false);
  this->declare_parameter<double>("allocated_time", 7.0);
  this->declare_parameter<bool>("forward_search", false);
  this->declare_parameter<double>("initial_epsilon", 3.0);
  this->declare_parameter<double>("robot_radius", robot_radius_);

  this->get_parameter("planner_type", planner_type_);
  this->get_parameter("search_until_first_solution", search_until_first_solution_);
  this->get_parameter("allocated_time", allocated_time_);
  this->get_parameter("forward_search", forward_search_);
  this->get_parameter("initial_epsilon", initial_epsilon_);
  this->get_parameter("robot_radius", robot_radius_);

  path_pub_ = this->create_publisher<nav_msgs::msg::Path>("path", 10);

  // subscriptions in SBPLPlanner2DNode
}

SBPLPlanner2D::~SBPLPlanner2D() {
}

void SBPLPlanner2D::goalCallback(const geometry_msgs::msg::PoseStamped::SharedPtr goal_pose) {
  goal_pose_ = goal_pose->pose;
  goal_received_ = true;
  RCLCPP_DEBUG(this->get_logger(), "Received goal: %f %f", goal_pose_.position.x, goal_pose_.position.y);

  if (goal_pose->header.frame_id != map_->getFrameID()) {
    RCLCPP_WARN(this->get_logger(), "Goal pose frame id \"%s\" different from map frame id \"%s\"", goal_pose->header.frame_id.c_str(), map_->getFrameID().c_str());
  }

  if (start_received_)
    plan();
}

void SBPLPlanner2D::startCallback(const geometry_msgs::msg::PoseWithCovarianceStamped::SharedPtr start_pose) {
  start_pose_ = start_pose->pose.pose;
  start_received_ = true;
  RCLCPP_DEBUG(this->get_logger(), "Received start: %f %f", start_pose_.position.x, start_pose_.position.y);

  if (start_pose->header.frame_id != map_->getFrameID()) {
    RCLCPP_WARN(this->get_logger(), "Start pose frame id \"%s\" different from map frame id \"%s\"", start_pose->header.frame_id.c_str(), map_->getFrameID().c_str());
  }

  if (goal_received_)
    plan();
}

bool SBPLPlanner2D::plan(const geometry_msgs::msg::Pose& start, const geometry_msgs::msg::Pose& goal) {
  start_pose_ = start;
  goal_pose_ = goal;

  start_received_ = true;
  goal_received_ = true;

  return plan();
}

bool SBPLPlanner2D::plan(double startX, double startY, double goalX, double goalY) {
  start_pose_.position.x = startX;
  start_pose_.position.y = startY;

  goal_pose_.position.x = goalX;
  goal_pose_.position.y = goalY;

  start_received_ = true;
  goal_received_ = true;

  return plan();
}

bool SBPLPlanner2D::plan() {
  path_.poses.clear();

  if (!map_) {
    RCLCPP_ERROR(this->get_logger(), "Map not set");
    return false;
  }

  unsigned start_x, start_y, goal_x, goal_y;
  if (!map_->worldToMap(start_pose_.position.x, start_pose_.position.y, start_x, start_y)) {
    RCLCPP_ERROR(this->get_logger(), "Start coordinates out of map bounds");
    return false;
  }
  if (!map_->worldToMap(goal_pose_.position.x, goal_pose_.position.y, goal_x, goal_y)) {
    RCLCPP_ERROR(this->get_logger(), "Goal coordinates out of map bounds");
    return false;
  }

  if (map_->isOccupiedAtCell(start_x, start_y)) {
    RCLCPP_ERROR(this->get_logger(), "Start coordinate (%f %f) is occupied in map", start_pose_.position.x, start_pose_.position.y);
    return false;
  }
  if (map_->isOccupiedAtCell(goal_x, goal_y)) {
    RCLCPP_ERROR(this->get_logger(), "Goal coordinate (%f %f) is occupied in map", goal_pose_.position.x, goal_pose_.position.y);
    return false;
  }

  int start_id = planner_environment_->SetStart(start_x, start_y);
  int goal_id = planner_environment_->SetGoal(goal_x, goal_y);

  if (start_id < 0 || planner_->set_start(start_id) == 0) {
    RCLCPP_ERROR(this->get_logger(), "Failed to set start state");
    return false;
  }

  if (goal_id < 0 || planner_->set_goal(goal_id) == 0) {
    RCLCPP_ERROR(this->get_logger(), "Failed to set goal state");
    return false;
  }

  planner_->set_initialsolution_eps(initial_epsilon_);
  planner_->set_search_mode(search_until_first_solution_);
  std::vector<int> solution_stateIDs;
  int solution_cost;

  if (planner_->replan(allocated_time_, &solution_stateIDs, &solution_cost))
    RCLCPP_DEBUG(this->get_logger(), "Solution found. Costs: %d;  final eps: %f", solution_cost, planner_->get_final_epsilon());
  else {
    RCLCPP_INFO(this->get_logger(), "Solution not found");
    return false;
  }

  path_costs_ = double(solution_cost) / ENVNAV2D_COSTMULT * map_->getResolution();

  path_.poses.reserve(solution_stateIDs.size());
  path_.header.frame_id = map_->getFrameID();
  path_.header.stamp = this->now();

  geometry_msgs::msg::PoseStamped pose;
  pose.header = path_.header;
  for (size_t i = 0; i < solution_stateIDs.size(); i++) {
    int mx, my;
    planner_environment_->GetCoordFromState(solution_stateIDs[i], mx, my);
    double wx, wy;
    map_->mapToWorld(mx, my, wx, wy);

    pose.pose.position.x = wx;
    pose.pose.position.y = wy;
    pose.pose.position.z = 0.0;
    path_.poses.push_back(pose);
  }

  path_pub_->publish(path_);

  return true;
}

void SBPLPlanner2D::mapCallback(const nav_msgs::msg::OccupancyGrid::SharedPtr occupancy_map) {
  gridmap_2d::GridMap2DPtr map(new gridmap_2d::GridMap2D(occupancy_map));
  updateMap(map);
}

bool SBPLPlanner2D::updateMap(gridmap_2d::GridMap2DPtr map) {
  planner_environment_.reset(new EnvironmentNAV2D());
  planner_environment_->InitializeEnv(int(map->getInfo().width), int(map->getInfo().height), 0, OBSTACLE_COST);
  setPlanner();

  map_.reset(new gridmap_2d::GridMap2D(*map));
  map_->inflateMap(robot_radius_);

  for (unsigned int j = 0; j < map_->getInfo().height; ++j) {
    for (unsigned int i = 0; i < map_->getInfo().width; ++i) {
      if (map_->isOccupiedAtCell(i, j))
        planner_environment_->UpdateCost(i, j, OBSTACLE_COST);
      else
        planner_environment_->UpdateCost(i, j, 0);
    }
  }

  RCLCPP_DEBUG(this->get_logger(), "Map set");

  return true;
}

void SBPLPlanner2D::setPlanner() {
  if (planner_type_ == "ARAPlanner") {
    planner_.reset(new ARAPlanner(planner_environment_.get(), forward_search_));
  } else if (planner_type_ == "ADPlanner") {
    planner_.reset(new ADPlanner(planner_environment_.get(), forward_search_));
  } else if (planner_type_ == "RSTARPlanner") {
    planner_.reset(new RSTARPlanner(planner_environment_.get(), forward_search_));
  }
}