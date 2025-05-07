#ifndef FOOTSTEP_PLANNER_FOOTSTEPPLANNER_H_
#define FOOTSTEP_PLANNER_FOOTSTEPPLANNER_H_

#include <geometry_msgs/msg/pose.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <humanoid_nav_msgs/srv/plan_footsteps.hpp>
#include <humanoid_nav_msgs/srv/plan_footsteps_between_feet.hpp>
#include <footstep_planner/helper.h>
#include <footstep_planner/PathCostHeuristic.h>
#include <footstep_planner/FootstepPlannerEnvironment.h>
#include <footstep_planner/PlanningStateChangeQuery.h>
#include <footstep_planner/State.h>
#include <nav_msgs/msg/path.hpp>
#include <nav_msgs/msg/occupancy_grid.hpp>
#include <rclcpp/rclcpp.hpp>
#include <sensor_msgs/msg/point_cloud.hpp>
#include <tf2/LinearMath/Transform.h>
#include <tf2/utils.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <visualization_msgs/msg/marker.hpp>
#include <visualization_msgs/msg/marker_array.hpp>
#include <footstep_planner/XmlRpcValue.h>
#include <footstep_planner/XmlRpcException.h>
#include <assert.h>
#include <time.h>

namespace footstep_planner
{
typedef std::vector<State>::const_iterator state_iter_t;

class FootstepPlanner : public rclcpp::Node
{
public:
  FootstepPlanner();
  virtual ~FootstepPlanner();

  bool plan(bool force_new_plan=true);
  bool plan(const geometry_msgs::msg::PoseStamped::SharedPtr start,
            const geometry_msgs::msg::PoseStamped::SharedPtr goal);
  bool plan(float start_x, float start_y, float start_theta,
            float goal_x, float goal_y, float goal_theta);
  bool replan();
  bool planService(const std::shared_ptr<humanoid_nav_msgs::srv::PlanFootsteps::Request> req,
                   std::shared_ptr<humanoid_nav_msgs::srv::PlanFootsteps::Response> resp);
  bool planFeetService(const std::shared_ptr<humanoid_nav_msgs::srv::PlanFootstepsBetweenFeet::Request> req,
                   std::shared_ptr<humanoid_nav_msgs::srv::PlanFootstepsBetweenFeet::Response> resp);
  bool setGoal(const State& left_foot, const State& right_foot);
  bool setGoal(const geometry_msgs::msg::PoseStamped::SharedPtr goal_pose);
  bool setGoal(float x, float y, float theta);
  bool setStart(const geometry_msgs::msg::PoseStamped::SharedPtr start_pose);
  bool setStart(float x, float y, float theta);
  bool setStart(const State& left_foot, const State& right_foot);
  bool updateMap(const gridmap_2d::GridMap2DPtr map);
  void setMarkerNamespace(const std::string& ns) { ivMarkerNamespace = ns; }
  void setMaxSearchTime(int search_time) { ivMaxSearchTime = search_time; }
  void goalPoseCallback(const geometry_msgs::msg::PoseStamped::SharedPtr goal_pose);
  void startPoseCallback(const geometry_msgs::msg::PoseWithCovarianceStamped::SharedPtr start_pose);
  void mapCallback(const nav_msgs::msg::OccupancyGrid::SharedPtr occupancy_map);
  void clearFootstepPathVis(unsigned num_footsteps=0);
  double getPathCosts() const { return ivPathCost; }
  size_t getNumExpandedStates() const { return ivPlannerPtr->get_n_expands(); }
  size_t getNumFootPoses() const { return ivPath.size(); }
  state_iter_t getPathBegin() const { return ivPath.begin(); }
  state_iter_t getPathEnd() const { return ivPath.end(); }
  int getPathSize() { return ivPath.size(); }
  State getStartFootLeft() { return ivStartFootLeft; }
  State getStartFootRight() { return ivStartFootRight; }
  void reset();
  void resetTotally();
  bool pathExists() { return (bool)ivPath.size(); }
  environment_params ivEnvironmentParams;

protected:
  void broadcastExpandedNodesVis();
  void broadcastRandomNodesVis();
  void broadcastFootstepPathVis();
  void broadcastHeuristicPathVis();
  void broadcastPathVis();
  void extractFootstepsSrv(std::vector<humanoid_nav_msgs::msg::StepTarget> & footsteps) const;
  bool pathIsNew(const std::vector<int>& new_path);
  bool extractPath(const std::vector<int>& state_ids);
  void footPoseToMarker(const State& footstep, visualization_msgs::msg::Marker* marker);
  bool run();
  State getFootPose(const State& robot, Leg side);
  void setPlanner();
  void updateEnvironment(const gridmap_2d::GridMap2DPtr old_map);

  std::shared_ptr<FootstepPlannerEnvironment> ivPlannerEnvironmentPtr;
  gridmap_2d::GridMap2DPtr ivMapPtr;
  std::shared_ptr<SBPLPlanner> ivPlannerPtr;
  std::shared_ptr<const PathCostHeuristic> ivPathCostHeuristicPtr;
  std::vector<State> ivPath;
  State ivStartFootLeft;
  State ivStartFootRight;
  State ivGoalFootLeft;
  State ivGoalFootRight;

  // rclcpp::Publisher<visualization_msgs::msg::Marker>::SharedPtr ivExpandedStatesVisPub;
  rclcpp::Publisher<sensor_msgs::msg::PointCloud>::SharedPtr ivExpandedStatesVisPub;
  rclcpp::Publisher<visualization_msgs::msg::MarkerArray>::SharedPtr ivFootstepPathVisPub;
  // rclcpp::Publisher<visualization_msgs::msg::Marker>::SharedPtr ivRandomStatesVisPub;
  rclcpp::Publisher<sensor_msgs::msg::PointCloud>::SharedPtr ivRandomStatesVisPub;
  rclcpp::Subscription<nav_msgs::msg::OccupancyGrid>::SharedPtr ivGridMapSub;
  // rclcpp::Publisher<visualization_msgs::msg::Marker>::SharedPtr ivHeuristicPathVisPub;
  rclcpp::Publisher<nav_msgs::msg::Path>::SharedPtr ivHeuristicPathVisPub;
  // rclcpp::Publisher<visualization_msgs::msg::Marker>::SharedPtr ivPathVisPub;
  rclcpp::Publisher<nav_msgs::msg::Path>::SharedPtr ivPathVisPub;
  // rclcpp::Publisher<visualization_msgs::msg::Marker>::SharedPtr ivStartPoseVisPub;
  rclcpp::Publisher<geometry_msgs::msg::PoseStamped>::SharedPtr ivStartPoseVisPub;
  rclcpp::Service<humanoid_nav_msgs::srv::PlanFootsteps>::SharedPtr ivFootstepPlanService;
  rclcpp::Service<humanoid_nav_msgs::srv::PlanFootstepsBetweenFeet>::SharedPtr ivFootstepPlanFeetService;

  double ivFootSeparation;
  double ivMaxStepWidth;
  int ivCollisionCheckAccuracy;
  bool ivStartPoseSetUp, ivGoalPoseSetUp;
  int ivLastMarkerMsgSize;
  double ivPathCost;
  bool ivSearchUntilFirstSolution;
  double ivMaxSearchTime;
  double ivInitialEpsilon;
  int ivChangedCellsLimit;
  std::string ivPlannerType;
  std::string ivMarkerNamespace;
  std::vector<int> ivPlanningStatesIds;
};

}  // namespace footstep_planner

#endif  // FOOTSTEP_PLANNER_FOOTSTEPPLANNER_H_