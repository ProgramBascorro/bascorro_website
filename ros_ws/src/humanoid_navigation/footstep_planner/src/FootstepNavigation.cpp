#include <footstep_planner/FootstepNavigation.h>

namespace footstep_planner
{
FootstepNavigation::FootstepNavigation()
: Node("footstep_navigation"),
  ivIdFootRight("/r_sole"),
  ivIdFootLeft("/l_sole"),
  ivIdMapFrame("map"),
  ivExecutingFootsteps(false),
  ivExecutionShift(2),
  ivControlStepIdx(-1),
  ivResetStepIdx(0)
{
  this->declare_parameter("rfoot_frame_id", ivIdFootRight);
  this->declare_parameter("lfoot_frame_id", ivIdFootLeft);
  this->declare_parameter("accuracy.footstep.x", 0.01);
  this->declare_parameter("accuracy.footstep.y", 0.01);
  this->declare_parameter("accuracy.footstep.theta", 0.1);
  this->declare_parameter("accuracy.cell_size", 0.005);
  this->declare_parameter("accuracy.num_angle_bins", 128);
  this->declare_parameter("forward_search", false);
  this->declare_parameter("feedback_frequency", 5.0);
  this->declare_parameter("safe_execution", true);
  this->declare_parameter("foot.max.step.x", 0.07);
  this->declare_parameter("foot.max.step.y", 0.15);
  this->declare_parameter("foot.max.step.theta", 0.3);
  this->declare_parameter("foot.max.inverse.step.x", -0.03);
  this->declare_parameter("foot.max.inverse.step.y", 0.09);
  this->declare_parameter("foot.max.inverse.step.theta", -0.01);
  this->declare_parameter("step_range.x", std::vector<double>());
  this->declare_parameter("step_range.y", std::vector<double>());

  this->get_parameter("rfoot_frame_id", ivIdFootRight);
  this->get_parameter("lfoot_frame_id", ivIdFootLeft);
  this->get_parameter("accuracy.footstep.x", ivAccuracyX);
  this->get_parameter("accuracy.footstep.y", ivAccuracyY);
  this->get_parameter("accuracy.footstep.theta", ivAccuracyTheta);
  this->get_parameter("accuracy.cell_size", ivCellSize);
  this->get_parameter("accuracy.num_angle_bins", ivNumAngleBins);
  this->get_parameter("forward_search", ivForwardSearch);
  this->get_parameter("feedback_frequency", ivFeedbackFrequency);
  this->get_parameter("safe_execution", ivSafeExecution);
  this->get_parameter("foot.max.step.x", ivMaxStepX);
  this->get_parameter("foot.max.step.y", ivMaxStepY);
  this->get_parameter("foot.max.step.theta", ivMaxStepTheta);
  this->get_parameter("foot.max.inverse.step.x", ivMaxInvStepX);
  this->get_parameter("foot.max.inverse.step.y", ivMaxInvStepY);
  this->get_parameter("foot.max.inverse.step.theta", ivMaxInvStepTheta);

  std::vector<double> step_range_x, step_range_y;
  this->get_parameter("step_range.x", step_range_x);
  this->get_parameter("step_range.y", step_range_y);

  if (step_range_x.size() != step_range_y.size())
  {
    RCLCPP_ERROR(this->get_logger(), "Step range points have different size. Exit!");
    exit(2);
  }

  ivStepRange.clear();
  ivStepRange.reserve(step_range_x.size());
  for (size_t i = 0; i < step_range_x.size(); ++i)
  {
    ivStepRange.push_back(std::pair<double, double>(step_range_x[i], step_range_y[i]));
  }
  ivStepRange.push_back(ivStepRange[0]);

  ivFootstepSrv = this->create_client<humanoid_nav_msgs::srv::StepTargetService>("footstep_srv");
  ivClipFootstepSrv = this->create_client<humanoid_nav_msgs::srv::ClipFootstep>("clip_footstep_srv");

  ivGridMapSub = this->create_subscription<nav_msgs::msg::OccupancyGrid>(
    "map", 1, std::bind(&FootstepNavigation::mapCallback, this, std::placeholders::_1));
  ivGoalPoseSub = this->create_subscription<geometry_msgs::msg::PoseStamped>(
    "goal", 1, std::bind(&FootstepNavigation::goalPoseCallback, this, std::placeholders::_1));
  
  tf_buffer_ = std::make_shared<tf2_ros::Buffer>(this->get_clock());
  tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);

  ivFootstepsExecution = rclcpp_action::create_client<ExecFootsteps>(
    this,
    "execute_footsteps");
}

FootstepNavigation::~FootstepNavigation()
{}

bool FootstepNavigation::plan()
{
  if (!updateStart())
  {
    RCLCPP_ERROR(this->get_logger(), "Start pose not accessible!");
    return false;
  }

  if (ivPlanner.plan())
  {
    startExecution();
    return true;
  }
  return false;
}

bool FootstepNavigation::replan()
{
  if (!updateStart())
  {
    RCLCPP_ERROR(this->get_logger(), "Start pose not accessible!");
    return false;
  }

  bool path_existed = ivPlanner.pathExists();

  if (ivPlanner.replan())
  {
    startExecution();
    return true;
  }
  else if (path_existed)
  {
    RCLCPP_INFO(this->get_logger(), "Replanning unsuccessful. Reseting previous planning information.");
    if (ivPlanner.plan())
    {
      startExecution();
      return true;
    }
  }
  ivExecutingFootsteps = false;
  return false;
}



void FootstepNavigation::startExecution()
{
  if (ivSafeExecution)
  {
    ivFootstepExecutionPtr = std::make_shared<std::thread>(
      &FootstepNavigation::executeFootsteps, this);
  }
  else
  {
    executeFootstepsFast();
  }
}

void FootstepNavigation::executeFootsteps()
{
  if (ivPlanner.getPathSize() <= 1)
    return;

  ivExecutingFootsteps = true;

  RCLCPP_INFO(this->get_logger(), "Start walking towards the goal.");

  humanoid_nav_msgs::msg::StepTarget step;
  humanoid_nav_msgs::srv::StepTargetService::Request step_srv;

  tf2::Transform from;
  std::string support_foot_id;

  state_iter_t to_planned = ivPlanner.getPathBegin();
  if (to_planned == ivPlanner.getPathEnd())
  {
    RCLCPP_ERROR(this->get_logger(), "No plan available. Return.");
    return;
  }

  const State* from_planned = to_planned.base();
  to_planned++;
  while (to_planned != ivPlanner.getPathEnd())
  {
    if (from_planned->getLeg() == RIGHT)
      support_foot_id = ivIdFootRight;
    else
      support_foot_id = ivIdFootLeft;

    if (getFootTransform(support_foot_id, ivIdMapFrame, rclcpp::Time(0),
                         rclcpp::Duration::from_seconds(0.5), &from))
    {
      auto request = std::make_shared<humanoid_nav_msgs::srv::StepTargetService::Request>();
      request->step = step;
      auto result_future = ivFootstepSrv->async_send_request(request);
      
      // Wait for the service to complete
      if (rclcpp::spin_until_future_complete(this->get_node_base_interface(), result_future) ==
          rclcpp::FutureReturnCode::SUCCESS)
      {
        // Service call succeeded
        auto result = result_future.get();
        // You can process the result here if needed
      }
      else
      {
        RCLCPP_ERROR(this->get_logger(), "Failed to call footstep service");
        // Handle the failure case
      }
    }
    else
    {
      rclcpp::sleep_for(std::chrono::milliseconds(500));
      continue;
    }

    from_planned = to_planned.base();
    to_planned++;
  }
  RCLCPP_INFO(this->get_logger(), "Succeeded walking to the goal.\n");

  ivExecutingFootsteps = false;
}

void FootstepNavigation::executeFootstepsFast()
{
  if (ivPlanner.getPathSize() <= 1)
    return;

  ivExecutingFootsteps = true;

  ivFootstepsExecution->wait_for_action_server();

  auto goal_msg = humanoid_nav_msgs::action::ExecFootsteps::Goal();
  State support_leg;
  if (ivPlanner.getPathBegin()->getLeg() == RIGHT)
    support_leg = ivPlanner.getStartFootRight();
  else
    support_leg = ivPlanner.getStartFootLeft();
  if (getFootstepsFromPath(support_leg, 1, goal_msg.footsteps))
  {
    goal_msg.feedback_frequency = ivFeedbackFrequency;
    ivControlStepIdx = 0;
    ivResetStepIdx = 0;

    // Create the SendGoalOptions with your callbacks
    rclcpp_action::Client<ExecFootsteps>::SendGoalOptions send_goal_options;
    send_goal_options.goal_response_callback =
      [this](const rclcpp_action::ClientGoalHandle<ExecFootsteps>::SharedPtr & goal_handle) {
        if (!goal_handle) {
          RCLCPP_ERROR(this->get_logger(), "Goal was rejected by server");
        } else {
          RCLCPP_INFO(this->get_logger(), "Goal accepted by server, waiting for result");
          this->activeCallback();
        }
      };
    send_goal_options.feedback_callback =
      [this](const rclcpp_action::ClientGoalHandle<ExecFootsteps>::SharedPtr & goal_handle,
             const std::shared_ptr<const ExecFootsteps::Feedback> feedback) {
        this->feedbackCallback(goal_handle, feedback);
      };
    send_goal_options.result_callback =
      [this](const rclcpp_action::ClientGoalHandle<ExecFootsteps>::WrappedResult & result) {
        this->doneCallback(result);
      };

    // Send the goal
    auto goal_handle_future = ivFootstepsExecution->async_send_goal(goal_msg, send_goal_options);
  }
  else
  {
    ivExecutingFootsteps = false;
    replan();
  }
}


void FootstepNavigation::activeCallback()
{
  ivExecutingFootsteps = true;
  RCLCPP_INFO(this->get_logger(), "Start walking towards the goal.");
}

void FootstepNavigation::doneCallback(
  const rclcpp_action::ClientGoalHandle<humanoid_nav_msgs::action::ExecFootsteps>::WrappedResult &result)
{
  if (result.code == rclcpp_action::ResultCode::SUCCEEDED)
    RCLCPP_INFO(this->get_logger(), "Succeeded walking to the goal.");
  else if (result.code == rclcpp_action::ResultCode::ABORTED)
    RCLCPP_INFO(this->get_logger(), "Failed walking to the goal.");
  else if (result.code == rclcpp_action::ResultCode::CANCELED)
    RCLCPP_INFO(this->get_logger(), "Preempted walking to the goal.");

  ivExecutingFootsteps = false;
}

// void FootstepNavigation::feedbackCallback(
//   rclcpp_action::ClientGoalHandle<humanoid_nav_msgs::action::ExecFootsteps>::SharedPtr,
//   const std::shared_ptr<const humanoid_nav_msgs::action::ExecFootsteps::Feedback> feedback)
void FootstepNavigation::feedbackCallback(
  rclcpp_action::ClientGoalHandle<ExecFootsteps>::SharedPtr goal_handle,
  const std::shared_ptr<const ExecFootsteps::Feedback> feedback)
{
  int executed_steps_idx = feedback->executed_footsteps.size() - ivExecutionShift;
  if (executed_steps_idx < 0)
    return;
  if (executed_steps_idx == ivControlStepIdx)
    return;

  const State& planned = *(ivPlanner.getPathBegin() + ivControlStepIdx + 1 + ivResetStepIdx);
  tf2::Transform executed_tf;
  std::string foot_id;
  if (planned.getLeg() == RIGHT)
    foot_id = ivIdFootRight;
  else
    foot_id = ivIdFootLeft;

  if (getFootTransform(foot_id, ivIdMapFrame, rclcpp::Time(0), rclcpp::Duration::from_seconds(0.5), &executed_tf))
  {
    State executed(executed_tf.getOrigin().x(), executed_tf.getOrigin().y(), tf2::getYaw(executed_tf.getRotation()), planned.getLeg());
    ivFootstepsExecution->async_cancel_all_goals();
    humanoid_nav_msgs::action::ExecFootsteps::Goal goal;
    if (getFootstepsFromPath(executed, executed_steps_idx + ivResetStepIdx, goal.footsteps))
    {
      goal.feedback_frequency = ivFeedbackFrequency;
      ivResetStepIdx += ivControlStepIdx + 1;
      ivControlStepIdx = 0;

      rclcpp_action::Client<ExecFootsteps>::SendGoalOptions send_goal_options;
      send_goal_options.goal_response_callback =
        [this](const rclcpp_action::ClientGoalHandle<ExecFootsteps>::SharedPtr & goal_handle) {
          if (!goal_handle) {
            RCLCPP_ERROR(this->get_logger(), "Goal was rejected by server");
          } else {
            RCLCPP_INFO(this->get_logger(), "Goal accepted by server, waiting for result");
            this->activeCallback();
          }
        };
      send_goal_options.feedback_callback =
        [this](const rclcpp_action::ClientGoalHandle<ExecFootsteps>::SharedPtr & goal_handle,
              const std::shared_ptr<const ExecFootsteps::Feedback> feedback) {
          this->feedbackCallback(goal_handle, feedback);
        };
      send_goal_options.result_callback =
        [this](const rclcpp_action::ClientGoalHandle<ExecFootsteps>::WrappedResult & result) {
          this->doneCallback(result);
        };

      // Send the goal
      auto goal_handle_future = ivFootstepsExecution->async_send_goal(goal, send_goal_options);
    }
    else
    {
      replan();
    }
  }

  State executed(executed_tf.getOrigin().x(), executed_tf.getOrigin().y(), tf2::getYaw(executed_tf.getRotation()), planned.getLeg());

  if (executed_steps_idx >= ivControlStepIdx + 2)
  {
    ivFootstepsExecution->async_cancel_all_goals();
    RCLCPP_DEBUG(this->get_logger(), "Footstep execution incorrect.");

    humanoid_nav_msgs::action::ExecFootsteps::Goal goal;
    if (getFootstepsFromPath(executed, executed_steps_idx + ivResetStepIdx, goal.footsteps))
    {
      RCLCPP_INFO(this->get_logger(), "Try to reach calculated path.");
      goal.feedback_frequency = ivFeedbackFrequency;
      ivResetStepIdx += ivControlStepIdx + 1;
      ivControlStepIdx = 0;

      rclcpp_action::Client<ExecFootsteps>::SendGoalOptions send_goal_options;
      send_goal_options.goal_response_callback =
        [this](const rclcpp_action::ClientGoalHandle<ExecFootsteps>::SharedPtr & goal_handle) {
          if (!goal_handle) {
            RCLCPP_ERROR(this->get_logger(), "Goal was rejected by server");
          } else {
            RCLCPP_INFO(this->get_logger(), "Goal accepted by server, waiting for result");
            this->activeCallback();
          }
        };
      send_goal_options.feedback_callback =
        [this](const rclcpp_action::ClientGoalHandle<ExecFootsteps>::SharedPtr & goal_handle,
              const std::shared_ptr<const ExecFootsteps::Feedback> feedback) {
          this->feedbackCallback(goal_handle, feedback);
        };
      send_goal_options.result_callback =
        [this](const rclcpp_action::ClientGoalHandle<ExecFootsteps>::WrappedResult & result) {
          this->doneCallback(result);
        };

      // Send the goal
      auto goal_handle_future = ivFootstepsExecution->async_send_goal(goal, send_goal_options);
    }
    else
    {
      replan();
    }

    return;
  }
  else
  {
    RCLCPP_DEBUG(this->get_logger(), "planned (%f, %f, %f, %i) vs. executed (%f, %f, %f, %i)",
                 planned.getX(), planned.getY(), planned.getTheta(), planned.getLeg(),
                 executed.getX(), executed.getY(), executed.getTheta(), executed.getLeg());

    if (performanceValid(planned, executed))
      ivControlStepIdx++;
    else
      RCLCPP_DEBUG(this->get_logger(), "Invalid step. Wait next step update before declaring step incorrect.");
  }
}


void FootstepNavigation::goalPoseCallback(
  const geometry_msgs::msg::PoseStamped::SharedPtr goal_pose)
{
  if (ivExecutingFootsteps)
  {
    RCLCPP_INFO(this->get_logger(), "Already performing a navigation task. Wait until it is finished.");
    return;
  }

  if (setGoal(goal_pose))
  {
    if (ivForwardSearch)
      replan();
    else
      plan();
  }
}

void FootstepNavigation::mapCallback(
  const nav_msgs::msg::OccupancyGrid::SharedPtr occupancy_map)
{
  if (ivExecutingFootsteps)
  {
    if (ivSafeExecution)
    {
      ivFootstepExecutionPtr->join();
    }
    else
    {
      ivFootstepsExecution->async_cancel_all_goals();
    }
  }

  gridmap_2d::GridMap2DPtr map(new gridmap_2d::GridMap2D(occupancy_map));
  ivIdMapFrame = map->getFrameID();

  if (ivPlanner.updateMap(map))
  {
    replan();
  }
}

bool FootstepNavigation::setGoal(const geometry_msgs::msg::PoseStamped::SharedPtr goal_pose)
{
  return setGoal(goal_pose->pose.position.x,
                 goal_pose->pose.position.y,
                 tf2::getYaw(goal_pose->pose.orientation));
}

bool FootstepNavigation::setGoal(float x, float y, float theta)
{
  return ivPlanner.setGoal(x, y, theta);
}

bool FootstepNavigation::updateStart()
{
  rclcpp::sleep_for(std::chrono::milliseconds(500));

  tf2::Transform foot_left, foot_right;
  {
    if (!getFootTransform(ivIdFootLeft, ivIdMapFrame, rclcpp::Time(0),
                          rclcpp::Duration::from_seconds(0.5), &foot_left))
    {
      if (ivPlanner.pathExists())
      {
        ivExecutingFootsteps = false;
      }
      return false;
    }
    if (!getFootTransform(ivIdFootRight, ivIdMapFrame, rclcpp::Time(0),
                          rclcpp::Duration::from_seconds(0.5), &foot_right))
    {
      if (ivPlanner.pathExists())
      {
        ivExecutingFootsteps = false;
      }
      return false;
    }
  }
  State left(foot_left.getOrigin().x(), foot_left.getOrigin().y(),
             tf2::getYaw(foot_left.getRotation()), LEFT);
  State right(foot_right.getOrigin().x(), foot_right.getOrigin().y(),
              tf2::getYaw(foot_right.getRotation()), RIGHT);

  RCLCPP_INFO(this->get_logger(), "Robot standing at (%f, %f, %f, %i) (%f, %f, %f, %i).",
              left.getX(), left.getY(), left.getTheta(), left.getLeg(),
              right.getX(), right.getY(), right.getTheta(), right.getLeg());

  return ivPlanner.setStart(left, right);
}

bool FootstepNavigation::getFootstep(const tf2::Transform& from,
                                     const State& from_planned,
                                     const State& to,
                                     humanoid_nav_msgs::msg::StepTarget* footstep)
{
  // tf2::Transform step = from.inverse() *
  //                       tf2::Transform(tf2::Quaternion(tf2::Vector3(0, 0, to.getTheta())),
  //                                      tf2::Vector3(to.getX(), to.getY(), 0.0));
  tf2::Quaternion q1;
  q1.setRPY(0, 0, to.getTheta());
  tf2::Transform step = from.inverse() *
                        tf2::Transform(q1,
                                      tf2::Vector3(to.getX(), to.getY(), 0.0));

  footstep->pose.x = step.getOrigin().x();
  footstep->pose.y = step.getOrigin().y();
  footstep->pose.theta = tf2::getYaw(step.getRotation());
  if (to.getLeg() == LEFT)
    footstep->leg = humanoid_nav_msgs::msg::StepTarget::LEFT;
  else
    footstep->leg = humanoid_nav_msgs::msg::StepTarget::RIGHT;

  if (performable(*footstep))
  {
    return true;
  }
  else
  {
    float step_diff_x = fabs(from.getOrigin().x() - from_planned.getX());
    float step_diff_y = fabs(from.getOrigin().y() - from_planned.getY());
    float step_diff_theta = fabs(
        angles::shortest_angular_distance(
            tf2::getYaw(from.getRotation()), from_planned.getTheta()));
    if (step_diff_x < ivAccuracyX && step_diff_y < ivAccuracyY &&
        step_diff_theta < ivAccuracyTheta)
    {
      // step = tf2::Transform(tf2::Quaternion(tf2::Vector3(0, 0, from_planned.getTheta())),
      //                       tf2::Vector3(from_planned.getX(), from_planned.getY(), 0.0)).inverse() *
      //        tf2::Transform(tf2::Quaternion(tf2::Vector3(0, 0, to.getTheta())),
      //                       tf2::Vector3(to.getX(), to.getY(), 0.0));
      tf2::Quaternion q2, q3;
      q2.setRPY(0, 0, from_planned.getTheta());
      q3.setRPY(0, 0, to.getTheta());
      step = tf2::Transform(q2,
                            tf2::Vector3(from_planned.getX(), from_planned.getY(), 0.0)).inverse() *
            tf2::Transform(q3,
                            tf2::Vector3(to.getX(), to.getY(), 0.0));

      footstep->pose.x = step.getOrigin().x();
      footstep->pose.y = step.getOrigin().y();
      footstep->pose.theta = tf2::getYaw(step.getRotation());

      return true;
    }

    return false;
  }
}


bool FootstepNavigation::getFootstepsFromPath(
  const State& current_support_leg, int starting_step_num,
  std::vector<humanoid_nav_msgs::msg::StepTarget>& footsteps)
{
  humanoid_nav_msgs::msg::StepTarget footstep;

  state_iter_t to_planned = ivPlanner.getPathBegin() + starting_step_num - 1;
  // tf2::Transform last(tf2::Quaternion(tf2::Vector3(0, 0, current_support_leg.getTheta())),
                      // tf2::Vector3(current_support_leg.getX(), current_support_leg.getY(), 0.0));
  tf2::Quaternion q4;
  q4.setRPY(0, 0, current_support_leg.getTheta());
  tf2::Transform last(q4,
                    tf2::Vector3(current_support_leg.getX(), current_support_leg.getY(), 0.0));

  const State* from_planned = to_planned.base();
  to_planned++;
  for (; to_planned != ivPlanner.getPathEnd(); to_planned++)
  {
    if (getFootstep(last, *from_planned, *to_planned, &footstep))
    {
      footsteps.push_back(footstep);
    }
    else
    {
      RCLCPP_ERROR(this->get_logger(), "Calculated path cannot be performed!");
      return false;
    }

    // last = tf2::Transform(tf2::Quaternion(tf2::Vector3(0, 0, to_planned->getTheta())),
    //                       tf2::Vector3(to_planned->getX(), to_planned->getY(), 0.0));
    tf2::Quaternion q5;
    q5.setRPY(0, 0, to_planned->getTheta());
    last = tf2::Transform(q5,
                          tf2::Vector3(to_planned->getX(), to_planned->getY(), 0.0));
    from_planned = to_planned.base();
  }

  return true;
}

bool FootstepNavigation::getFootTransform(const std::string& foot_id,
                                          const std::string& world_frame_id,
                                          const rclcpp::Time& time,
                                          const rclcpp::Duration& waiting_time,
                                          tf2::Transform* foot)
{
  geometry_msgs::msg::TransformStamped stamped_foot_transform;
  try
  {
    stamped_foot_transform = tf_buffer_->lookupTransform(world_frame_id, foot_id, time, waiting_time);
  }
  catch (const tf2::TransformException& e)
  {
    RCLCPP_WARN(this->get_logger(), "Failed to obtain FootTransform from tf (%s)", e.what());
    return false;
  }

  foot->setOrigin(tf2::Vector3(stamped_foot_transform.transform.translation.x,
                               stamped_foot_transform.transform.translation.y,
                               stamped_foot_transform.transform.translation.z));
  foot->setRotation(tf2::Quaternion(stamped_foot_transform.transform.rotation.x,
                                    stamped_foot_transform.transform.rotation.y,
                                    stamped_foot_transform.transform.rotation.z,
                                    stamped_foot_transform.transform.rotation.w));

  return true;
}

bool FootstepNavigation::performanceValid(float a_x, float a_y, float a_theta,
                                          float b_x, float b_y, float b_theta)
{
  return (fabs(a_x - b_x) < ivAccuracyX &&
          fabs(a_y - b_y) < ivAccuracyY &&
          fabs(angles::shortest_angular_distance(a_theta, b_theta)) < ivAccuracyTheta);
}

bool FootstepNavigation::performanceValid(
  const humanoid_nav_msgs::srv::ClipFootstep::Request& request,
  const humanoid_nav_msgs::srv::ClipFootstep::Response& response)
{
  return performanceValid(request.step.pose.x,
                          request.step.pose.y,
                          request.step.pose.theta,
                          response.step.pose.x,
                          response.step.pose.y,
                          response.step.pose.theta);
}

bool FootstepNavigation::performanceValid(const State& planned,
                                          const State& executed)
{
  return performanceValid(
    planned.getX(), planned.getY(), planned.getTheta(),
    executed.getX(), executed.getY(), executed.getTheta());
}

bool FootstepNavigation::performable(const humanoid_nav_msgs::msg::StepTarget& footstep)
{
  float step_x = footstep.pose.x;
  float step_y = footstep.pose.y;
  float step_theta = footstep.pose.theta;

  if (footstep.leg == humanoid_nav_msgs::msg::StepTarget::RIGHT)
  {
    step_y = -step_y;
    step_theta = -step_theta;
  }

  if (step_x + FLOAT_CMP_THR > ivMaxStepX ||
      step_x - FLOAT_CMP_THR < ivMaxInvStepX)
    return false;
  if (step_y + FLOAT_CMP_THR > ivMaxStepY ||
      step_y - FLOAT_CMP_THR < ivMaxInvStepY)
    return false;
  if (step_theta + FLOAT_CMP_THR > ivMaxStepTheta ||
      step_theta - FLOAT_CMP_THR < ivMaxInvStepTheta)
    return false;

  return performable(step_x, step_y);
}

bool FootstepNavigation::performable(float step_x, float step_y)
{
  int cn = 0;

  for(unsigned int i = 0; i < ivStepRange.size() - 1; ++i)
  {
    if ((ivStepRange[i].second <= step_y &&
         ivStepRange[i + 1].second > step_y) ||
        (ivStepRange[i].second >= step_y &&
         ivStepRange[i + 1].second < step_y))
    {
      float vt = (float)(step_y - ivStepRange[i].second) /
        (ivStepRange[i + 1].second - ivStepRange[i].second);
      if (step_x <
          ivStepRange[i].first + vt *
            (ivStepRange[i + 1].first - ivStepRange[i].first))
      {
        ++cn;
      }
    }
  }
  return cn & 1;
}
}