#ifndef FOOTSTEP_PLANNER_FOOTSTEPNAVIGATION_H_
#define FOOTSTEP_PLANNER_FOOTSTEPNAVIGATION_H_

#include <rclcpp/rclcpp.hpp>
#include <rclcpp_action/rclcpp_action.hpp>
#include <footstep_planner/FootstepPlanner.h>
#include <footstep_planner/State.h>
#include <geometry_msgs/msg/pose.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <humanoid_nav_msgs/srv/clip_footstep.hpp>
#include <humanoid_nav_msgs/action/exec_footsteps.hpp>
#include <humanoid_nav_msgs/srv/plan_footsteps.hpp>
#include <humanoid_nav_msgs/srv/step_target_service.hpp>
#include <nav_msgs/msg/path.hpp>
#include <nav_msgs/msg/occupancy_grid.hpp>
#include <tf2/LinearMath/Transform.h>
#include <tf2_ros/transform_listener.h>
#include <tf2_ros/buffer.h>
#include <tf2/utils.h>
// #include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include "/home/farhan/migratefeb_ws/src/geometry2/tf2_geometry_msgs/include/tf2_geometry_msgs/tf2_geometry_msgs.hpp" // atur sesuai nama user
#include <assert.h>
#include <mutex>
#include <thread>

namespace footstep_planner
{

class FootstepNavigation : public rclcpp::Node
{
public:
  using ExecFootsteps = humanoid_nav_msgs::action::ExecFootsteps;
  using GoalHandleExecFootsteps = rclcpp_action::ClientGoalHandle<ExecFootsteps>;

  FootstepNavigation();
  virtual ~FootstepNavigation();

  bool setGoal(const geometry_msgs::msg::PoseStamped::SharedPtr goal_pose);
  bool setGoal(float x, float y, float theta);

  void goalPoseCallback(const geometry_msgs::msg::PoseStamped::SharedPtr goal_pose);
  void mapCallback(const nav_msgs::msg::OccupancyGrid::SharedPtr occupancy_map);

protected:
  bool plan();
  bool replan();
  void startExecution();

  bool getFootTransform(const std::string& foot_id,
                        const std::string& world_frame_id,
                        const rclcpp::Time& time,
                        const rclcpp::Duration& waiting_time,
                        tf2::Transform* foot);

  bool getFootstep(const tf2::Transform& from, const State& from_planned,
                   const State& to, humanoid_nav_msgs::msg::StepTarget* footstep);

  bool getFootstepsFromPath(
      const State& current_support_leg, int starting_step_num,
      std::vector<humanoid_nav_msgs::msg::StepTarget>& footsteps);

  bool updateStart();
  void executeFootsteps();
  void executeFootstepsFast();

  void activeCallback();
  void doneCallback(const GoalHandleExecFootsteps::WrappedResult& result);
  // void feedbackCallback(GoalHandleExecFootsteps::SharedPtr, const std::shared_ptr<const humanoid_nav_msgs::msg::ExecFootstepsFeedback> feedback);
  void feedbackCallback(
    rclcpp_action::ClientGoalHandle<ExecFootsteps>::SharedPtr goal_handle,
    const std::shared_ptr<const ExecFootsteps::Feedback> feedback);

  bool performable(const humanoid_nav_msgs::msg::StepTarget& footstep);
  bool performable(float step_x, float step_y);

  // bool performanceValid(const humanoid_nav_msgs::srv::ClipFootstep& footstep);
  bool performanceValid(
    const humanoid_nav_msgs::srv::ClipFootstep::Request& request,
    const humanoid_nav_msgs::srv::ClipFootstep::Response& response);
  bool performanceValid(const State& planned, const State& executed);
  bool performanceValid(float a_x, float a_y, float a_theta,
                        float b_x, float b_y, float b_theta);

  FootstepPlanner ivPlanner;

  rclcpp::Subscription<nav_msgs::msg::OccupancyGrid>::SharedPtr ivGridMapSub;
  rclcpp::Subscription<geometry_msgs::msg::PoseStamped>::SharedPtr ivGoalPoseSub;

  rclcpp::Client<humanoid_nav_msgs::srv::StepTargetService>::SharedPtr ivFootstepSrv;
  rclcpp::Client<humanoid_nav_msgs::srv::ClipFootstep>::SharedPtr ivClipFootstepSrv;

  std::shared_ptr<tf2_ros::Buffer> tf_buffer_;
  std::shared_ptr<tf2_ros::TransformListener> tf_listener_;

  std::mutex ivExecutionLock;
  std::shared_ptr<std::thread> ivFootstepExecutionPtr;

  std::string ivIdFootRight;
  std::string ivIdFootLeft;
  std::string ivIdMapFrame;

  double ivAccuracyX;
  double ivAccuracyY;
  double ivAccuracyTheta;
  double ivCellSize;
  int ivNumAngleBins;

  bool ivForwardSearch;
  bool ivExecutingFootsteps;
  double ivFeedbackFrequency;

  rclcpp_action::Client<ExecFootsteps>::SharedPtr ivFootstepsExecution;

  const int ivExecutionShift;
  int ivControlStepIdx;
  int ivResetStepIdx;
  bool ivSafeExecution;

  double ivMaxStepX;
  double ivMaxStepY;
  double ivMaxStepTheta;
  double ivMaxInvStepX;
  double ivMaxInvStepY;
  double ivMaxInvStepTheta;

  std::vector<std::pair<double, double>> ivStepRange;
};

}  // namespace footstep_planner

#endif  // FOOTSTEP_PLANNER_FOOTSTEPNAVIGATION_H_