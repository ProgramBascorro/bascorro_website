#ifndef BALL_FOLLOWER_HPP_
#define BALL_FOLLOWER_HPP_

#include <cmath>
#include <numeric>
#include <rclcpp/rclcpp.hpp>
#include <ament_index_cpp/get_package_share_directory.hpp>
#include <std_msgs/msg/string.hpp>
#include <std_msgs/msg/int32.hpp>
#include <sensor_msgs/msg/joint_state.hpp>
#include <geometry_msgs/msg/point.hpp>
#include <yaml-cpp/yaml.h>

#include "robotis_controller_msgs/msg/joint_ctrl_module.hpp"
#include "op3_ball_detector/msg/circle_set_stamped.hpp"
#include "op3_walking_module_msgs/msg/walking_param.hpp"
#include "op3_walking_module_msgs/srv/get_walking_param.hpp"

namespace robotis_op
{

// following the ball using walking
class BallFollower
{
 public:
  enum
  {
    NotFound = 0,
    OutOfRange = 1,
    OnRight = 2,
    OnLeft = 3,
  };

  BallFollower();
  ~BallFollower();

  bool processFollowing(double x_angle, double y_angle, double ball_size);
  void decideBallPositin(double x_angle, double y_angle);
  void waitFollowing();
  void startFollowing();
  void stopFollowing();
  void clearBallPosition()
  {
    approach_ball_position_ = NotFound;
  }

  int getBallPosition()
  {
    return approach_ball_position_;
  }

  bool isBallInRange()
  {
    return (approach_ball_position_ == OnRight || approach_ball_position_ == OnLeft);
  }

 protected:
  const bool DEBUG_PRINT;
  const double CAMERA_HEIGHT;
  const int NOT_FOUND_THRESHOLD;
  const double FOV_WIDTH;
  const double FOV_HEIGHT;
  const double MAX_FB_STEP;
  const double MAX_RL_TURN;
  const double IN_PLACE_FB_STEP;
  const double MIN_FB_STEP;
  const double MIN_RL_TURN;
  const double UNIT_FB_STEP;
  const double UNIT_RL_TURN;

  const double SPOT_FB_OFFSET;
  const double SPOT_RL_OFFSET;
  const double SPOT_ANGLE_OFFSET;

  void currentJointStatesCallback(const sensor_msgs::msg::JointState::SharedPtr msg);
  void setWalkingCommand(const std::string &command);
  void setWalkingParam(double x_move, double y_move, double rotation_angle, bool balance = true);
  bool getWalkingParam();
  void calcFootstep(double target_distance, double target_angle, double delta_time,
                    double& fb_move, double& rl_angle);

  // ROS 2 node handle
  rclcpp::Node::SharedPtr nh_;

  // image publisher/subscriber
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr module_control_pub_;
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr head_joint_pub_;
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr head_scan_pub_;
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr set_walking_command_pub_;
  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr set_walking_param_pub_;

  rclcpp::Publisher<std_msgs::msg::String>::SharedPtr motion_index_pub_;
  rclcpp::Client<op3_walking_module_msgs::srv::GetWalkingParam>::SharedPtr get_walking_param_client_;

  rclcpp::Subscription<op3_ball_detector::msg::CircleSetStamped>::SharedPtr ball_position_sub_;
  rclcpp::Subscription<std_msgs::msg::String>::SharedPtr ball_tracking_command_sub_;
  rclcpp::Subscription<sensor_msgs::msg::JointState>::SharedPtr current_joint_states_sub_;

  // (x, y) is the center position of the ball in image coordinates
  // z is the ball radius
  geometry_msgs::msg::Point ball_position_;
  op3_walking_module_msgs::msg::WalkingParam current_walking_param_;

  int count_not_found_;
  int count_to_kick_;
  bool on_tracking_;
  int approach_ball_position_;
  double current_pan_, current_tilt_;
  double current_x_move_, current_r_angle_;
  int kick_motion_index_;
  double hip_pitch_offset_;
  rclcpp::Time prev_time_;

  double curr_period_time_;
  double accum_period_time_;

};
}

#endif /* BALL_FOLLOWER_HPP_ */