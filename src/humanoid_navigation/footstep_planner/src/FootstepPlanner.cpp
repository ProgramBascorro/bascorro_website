#include <footstep_planner/FootstepPlanner.h>
#include <humanoid_nav_msgs/srv/clip_footstep.hpp>


using gridmap_2d::GridMap2D;
using gridmap_2d::GridMap2DPtr;

namespace footstep_planner
{
FootstepPlanner::FootstepPlanner()
: Node("footstep_planner"),
  ivStartPoseSetUp(false),
  ivGoalPoseSetUp(false),
  ivLastMarkerMsgSize(0),
  ivPathCost(0),
  ivMarkerNamespace("")
{
  // Publishers
  ivExpandedStatesVisPub = this->create_publisher<sensor_msgs::msg::PointCloud>("expanded_states", 1);
  ivRandomStatesVisPub = this->create_publisher<sensor_msgs::msg::PointCloud>("random_states", 1);
  ivFootstepPathVisPub = this->create_publisher<visualization_msgs::msg::MarkerArray>("footsteps_array", 1);
  ivHeuristicPathVisPub = this->create_publisher<nav_msgs::msg::Path>("heuristic_path", 1);
  ivPathVisPub = this->create_publisher<nav_msgs::msg::Path>("path", 1);
  ivStartPoseVisPub = this->create_publisher<geometry_msgs::msg::PoseStamped>("start", 1);

  std::string heuristic_type;
  double diff_angle_cost;

  // Declare parameters
  this->declare_parameter("heuristic_type", "EuclideanHeuristic");
  this->declare_parameter("heuristic_scale", 1.0);
  this->declare_parameter("max_hash_size", 65536);
  this->declare_parameter("accuracy.collision_check", 2);
  this->declare_parameter("accuracy.cell_size", 0.01);
  this->declare_parameter("accuracy.num_angle_bins", 64);
  this->declare_parameter("step_cost", 0.05);
  this->declare_parameter("diff_angle_cost", 0.0);
  this->declare_parameter("planner_type", "ARAPlanner");
  this->declare_parameter("search_until_first_solution", false);
  this->declare_parameter("allocated_time", 7.0);
  this->declare_parameter("forward_search", false);
  this->declare_parameter("initial_epsilon", 3.0);
  this->declare_parameter("changed_cells_limit", 20000);
  this->declare_parameter("num_random_nodes", 20);
  this->declare_parameter("random_node_dist", 1.0);
  this->declare_parameter("foot.size.x", 0.16);
  this->declare_parameter("foot.size.y", 0.06);
  this->declare_parameter("foot.size.z", 0.015);
  this->declare_parameter("foot.separation", 0.1);
  this->declare_parameter("foot.origin_shift.x", 0.02);
  this->declare_parameter("foot.origin_shift.y", 0.0);
  this->declare_parameter("foot.max.step.x", 0.08);
  this->declare_parameter("foot.max.step.y", 0.16);
  this->declare_parameter("foot.max.step.theta", 0.3);
  this->declare_parameter("foot.max.inverse.step.x", -0.04);
  this->declare_parameter("foot.max.inverse.step.y", 0.09);
  this->declare_parameter("foot.max.inverse.step.theta", -0.3);

  // Get parameters
  this->get_parameter("heuristic_type", heuristic_type);
  this->get_parameter("heuristic_scale", ivEnvironmentParams.heuristic_scale);
  this->get_parameter("max_hash_size", ivEnvironmentParams.hash_table_size);
  this->get_parameter("accuracy.collision_check", ivEnvironmentParams.collision_check_accuracy);
  this->get_parameter("accuracy.cell_size", ivEnvironmentParams.cell_size);
  this->get_parameter("accuracy.num_angle_bins", ivEnvironmentParams.num_angle_bins);
  this->get_parameter("step_cost", ivEnvironmentParams.step_cost);
  this->get_parameter("diff_angle_cost", diff_angle_cost);
  this->get_parameter("planner_type", ivPlannerType);
  this->get_parameter("search_until_first_solution", ivSearchUntilFirstSolution);
  this->get_parameter("allocated_time", ivMaxSearchTime);
  this->get_parameter("forward_search", ivEnvironmentParams.forward_search);
  this->get_parameter("initial_epsilon", ivInitialEpsilon);
  this->get_parameter("changed_cells_limit", ivChangedCellsLimit);
  this->get_parameter("num_random_nodes", ivEnvironmentParams.num_random_nodes);
  this->get_parameter("random_node_dist", ivEnvironmentParams.random_node_distance);
  this->get_parameter("foot.size.x", ivEnvironmentParams.footsize_x);
  this->get_parameter("foot.size.y", ivEnvironmentParams.footsize_y);
  this->get_parameter("foot.size.z", ivEnvironmentParams.footsize_z);
  this->get_parameter("foot.separation", ivFootSeparation);
  this->get_parameter("foot.origin_shift.x", ivEnvironmentParams.foot_origin_shift_x);
  this->get_parameter("foot.origin_shift.y", ivEnvironmentParams.foot_origin_shift_y);
  this->get_parameter("foot.max.step.x", ivEnvironmentParams.max_footstep_x);
  this->get_parameter("foot.max.step.y", ivEnvironmentParams.max_footstep_y);
  this->get_parameter("foot.max.step.theta", ivEnvironmentParams.max_footstep_theta);
  this->get_parameter("foot.max.inverse.step.x", ivEnvironmentParams.max_inverse_footstep_x);
  this->get_parameter("foot.max.inverse.step.y", ivEnvironmentParams.max_inverse_footstep_y);
  this->get_parameter("foot.max.inverse.step.theta", ivEnvironmentParams.max_inverse_footstep_theta);

  // Footstep discretization
  std::vector<double> footsteps_x, footsteps_y, footsteps_theta;
  this->get_parameter("footsteps.x", footsteps_x);
  this->get_parameter("footsteps.y", footsteps_y);
  this->get_parameter("footsteps.theta", footsteps_theta);
  if (footsteps_x.size() != footsteps_y.size() || footsteps_x.size() != footsteps_theta.size())
  {
    RCLCPP_ERROR(this->get_logger(), "Footstep parameterization has different sizes for x/y/theta. Exit!");
    exit(2);
  }
  ivEnvironmentParams.footstep_set.clear();
  double max_step_width = 0;
  for (size_t i = 0; i < footsteps_x.size(); ++i)
  {
    double x = footsteps_x[i];
    double y = footsteps_y[i];
    double theta = footsteps_theta[i];

    Footstep f(x, y, theta, ivEnvironmentParams.cell_size, ivEnvironmentParams.num_angle_bins, ivEnvironmentParams.hash_table_size);
    ivEnvironmentParams.footstep_set.push_back(f);

    double cur_step_width = sqrt(x * x + y * y);
    if (cur_step_width > max_step_width)
      max_step_width = cur_step_width;
  }

  // Step range
  std::vector<double> step_range_x, step_range_y;
  this->get_parameter("step_range.x", step_range_x);
  this->get_parameter("step_range.y", step_range_y);
  if (step_range_x.size() != step_range_y.size())
  {
    RCLCPP_ERROR(this->get_logger(), "Step range points have different size. Exit!");
    exit(2);
  }
  ivEnvironmentParams.step_range.clear();
  ivEnvironmentParams.step_range.reserve(step_range_x.size());
  double x, y;
  double max_x = 0.0;
  double max_y = 0.0;
  double cell_size = ivEnvironmentParams.cell_size;
  for (size_t i = 0; i < step_range_x.size(); ++i)
  {
    x = step_range_x[i];
    y = step_range_y[i];
    if (fabs(x) > max_x)
      max_x = fabs(x);
    if (fabs(y) > max_y)
      max_y = fabs(y);
    ivEnvironmentParams.step_range.push_back(std::pair<int, int>(disc_val(x, cell_size), disc_val(y, cell_size)));
  }
  ivEnvironmentParams.step_range.push_back(ivEnvironmentParams.step_range[0]);
  ivEnvironmentParams.max_step_width = sqrt(max_x * max_x + max_y * max_y) * 1.5;

  // Initialize the heuristic
  std::shared_ptr<Heuristic> h;
  if (heuristic_type == "EuclideanHeuristic")
  {
    h.reset(new EuclideanHeuristic(ivEnvironmentParams.cell_size, ivEnvironmentParams.num_angle_bins));
    RCLCPP_INFO(this->get_logger(), "FootstepPlanner heuristic: euclidean distance");
  }
  else if (heuristic_type == "EuclStepCostHeuristic")
  {
    h.reset(new EuclStepCostHeuristic(ivEnvironmentParams.cell_size, ivEnvironmentParams.num_angle_bins, ivEnvironmentParams.step_cost, diff_angle_cost, max_step_width));
    RCLCPP_INFO(this->get_logger(), "FootstepPlanner heuristic: euclidean distance with step costs");
  }
  else if (heuristic_type == "PathCostHeuristic")
  {
    double foot_incircle = std::min((ivEnvironmentParams.footsize_x / 2.0 - std::abs(ivEnvironmentParams.foot_origin_shift_x)), (ivEnvironmentParams.footsize_y / 2.0 - std::abs(ivEnvironmentParams.foot_origin_shift_y)));
    assert(foot_incircle > 0.0);

    h.reset(new PathCostHeuristic(ivEnvironmentParams.cell_size, ivEnvironmentParams.num_angle_bins, ivEnvironmentParams.step_cost, diff_angle_cost, max_step_width, foot_incircle));
    RCLCPP_INFO(this->get_logger(), "FootstepPlanner heuristic: 2D path euclidean distance with step costs");

    ivPathCostHeuristicPtr = std::dynamic_pointer_cast<PathCostHeuristic>(h);
  }
  else
  {
    RCLCPP_ERROR(this->get_logger(), "Heuristic %s not available, exiting.", heuristic_type.c_str());
    exit(1);
  }
  ivEnvironmentParams.heuristic = h;

  // Initialize the planner environment
  ivPlannerEnvironmentPtr.reset(new FootstepPlannerEnvironment(ivEnvironmentParams));

  // Set up planner
  if (ivPlannerType == "ARAPlanner" || ivPlannerType == "ADPlanner" || ivPlannerType == "RSTARPlanner")
  {
    RCLCPP_INFO(this->get_logger(), "Planning with %s", ivPlannerType.c_str());
  }
  else
  {
    RCLCPP_ERROR(this->get_logger(), "Planner %s not available / untested.", ivPlannerType.c_str());
    exit(1);
  }
  if (ivEnvironmentParams.forward_search)
  {
    RCLCPP_INFO(this->get_logger(), "Search direction: forward planning");
  }
  else
  {
    RCLCPP_INFO(this->get_logger(), "Search direction: backward planning");
  }
  setPlanner();
}


FootstepPlanner::~FootstepPlanner()
{}

void FootstepPlanner::setPlanner()
{
  if (ivPlannerType == "ARAPlanner")
  {
    ivPlannerPtr.reset(
        new ARAPlanner(ivPlannerEnvironmentPtr.get(),
                       ivEnvironmentParams.forward_search));
  }
  else if (ivPlannerType == "ADPlanner")
  {
    ivPlannerPtr.reset(
        new ADPlanner(ivPlannerEnvironmentPtr.get(),
                      ivEnvironmentParams.forward_search));
  }
  else if (ivPlannerType == "RSTARPlanner")
  {
    RSTARPlanner* p =
        new RSTARPlanner(ivPlannerEnvironmentPtr.get(),
                         ivEnvironmentParams.forward_search);
    ivPlannerPtr.reset(p);
  }
}

bool FootstepPlanner::run()
{
  bool path_existed = (bool)ivPath.size();
  int ret = 0;
  MDPConfig mdp_config;
  std::vector<int> solution_state_ids;

  // commit start/goal poses to the environment
  ivPlannerEnvironmentPtr->updateStart(ivStartFootLeft, ivStartFootRight);
  ivPlannerEnvironmentPtr->updateGoal(ivGoalFootLeft, ivGoalFootRight);
  ivPlannerEnvironmentPtr->updateHeuristicValues();
  ivPlannerEnvironmentPtr->InitializeEnv(NULL);
  ivPlannerEnvironmentPtr->InitializeMDPCfg(&mdp_config);

  // inform AD planner about changed (start) states for replanning
  if (path_existed &&
      !ivEnvironmentParams.forward_search &&
      ivPlannerType == "ADPlanner")
  {
    std::vector<int> changed_edges;
    changed_edges.push_back(mdp_config.startstateid);
    std::shared_ptr<ADPlanner> ad_planner =
      std::dynamic_pointer_cast<ADPlanner>(ivPlannerPtr);
    ad_planner->update_preds_of_changededges(&changed_edges);
  }

  // set up SBPL
  if (ivPlannerPtr->set_start(mdp_config.startstateid) == 0)
  {
    RCLCPP_ERROR(this->get_logger(), "Failed to set start state.");
    return false;
  }
  if (ivPlannerPtr->set_goal(mdp_config.goalstateid) == 0)
  {
    RCLCPP_ERROR(this->get_logger(), "Failed to set goal state");
    return false;
  }

  ivPlannerPtr->set_initialsolution_eps(ivInitialEpsilon);
  ivPlannerPtr->set_search_mode(ivSearchUntilFirstSolution);

  RCLCPP_INFO(this->get_logger(), "Start planning (max time: %f, initial eps: %f (%f))",
           ivMaxSearchTime, ivInitialEpsilon,
           ivPlannerPtr->get_initial_eps());
  int path_cost;
  auto startTime = this->now();
  try
  {
    ret = ivPlannerPtr->replan(ivMaxSearchTime, &solution_state_ids,
                               &path_cost);
  }
  catch (const SBPL_Exception& e)
  {
    return false;
  }
  ivPathCost = double(path_cost) / FootstepPlannerEnvironment::cvMmScale;

  bool path_is_new = pathIsNew(solution_state_ids);
  if (ret && solution_state_ids.size() > 0)
  {
    if (!path_is_new)
      RCLCPP_WARN(this->get_logger(), "Solution found by SBPL is the same as the old solution. This could indicate that replanning failed.");

    RCLCPP_INFO(this->get_logger(), "Solution of size %zu found after %f s",
             solution_state_ids.size(),
             (this->now()-startTime).seconds());

    if (extractPath(solution_state_ids))
    {
      RCLCPP_INFO(this->get_logger(), "Expanded states: %i total / %i new",
               ivPlannerEnvironmentPtr->getNumExpandedStates(),
               ivPlannerPtr->get_n_expands());
      RCLCPP_INFO(this->get_logger(), "Final eps: %f", ivPlannerPtr->get_final_epsilon());
      RCLCPP_INFO(this->get_logger(), "Path cost: %f (%i)",
               ivPathCost, path_cost);

      ivPlanningStatesIds = solution_state_ids;

      broadcastExpandedNodesVis();
      broadcastRandomNodesVis();
      broadcastFootstepPathVis();
      broadcastPathVis();

      return true;
    }
    else
    {
      RCLCPP_ERROR(this->get_logger(), "extracting path failed");
      return false;
    }
  }
  else
  {
    broadcastExpandedNodesVis();
    broadcastRandomNodesVis();

    RCLCPP_ERROR(this->get_logger(), "No solution found");
    return false;
  }
}

bool FootstepPlanner::extractPath(const std::vector<int>& state_ids)
{
  ivPath.clear();

  State s;
  State start_left;
  std::vector<int>::const_iterator state_ids_iter = state_ids.begin();

  // first state is always the robot's left foot
  if (!ivPlannerEnvironmentPtr->getState(*state_ids_iter, &start_left))
  {
    ivPath.clear();
    return false;
  }
  ++state_ids_iter;
  if (!ivPlannerEnvironmentPtr->getState(*state_ids_iter, &s))
  {
    ivPath.clear();
    return false;
  }
  ++state_ids_iter;

  // check if the robot's left foot can be omitted as first state in the path,
  // i.e. the robot's right foot is appended first to the path
  if (s.getLeg() == LEFT)
    ivPath.push_back(ivStartFootRight);
  else
    ivPath.push_back(start_left);
  ivPath.push_back(s);

  for(; state_ids_iter < state_ids.end(); ++state_ids_iter)
  {
    if (!ivPlannerEnvironmentPtr->getState(*state_ids_iter, &s))
    {
      ivPath.clear();
      return false;
    }
    ivPath.push_back(s);
  }

  // add last neutral step
  if (ivPath.back().getLeg() == RIGHT)
    ivPath.push_back(ivGoalFootLeft);
  else // last_leg == LEFT
    ivPath.push_back(ivGoalFootRight);

  return true;
}


void FootstepPlanner::reset()
{
  RCLCPP_INFO(this->get_logger(), "Resetting planner");
  ivPath.clear();
  ivPlanningStatesIds.clear();
  ivPlannerEnvironmentPtr->reset();
  setPlanner();
}

void FootstepPlanner::resetTotally()
{
  RCLCPP_INFO(this->get_logger(), "Resetting planner and environment");
  ivPath.clear();
  ivPlanningStatesIds.clear();
  ivPlannerEnvironmentPtr.reset(
      new FootstepPlannerEnvironment(ivEnvironmentParams));
  setPlanner();
}

bool FootstepPlanner::plan(bool force_new_plan)
{
  if (!ivMapPtr)
  {
    RCLCPP_ERROR(this->get_logger(), "FootstepPlanner has no map for planning yet.");
    return false;
  }
  if (!ivGoalPoseSetUp || !ivStartPoseSetUp)
  {
    RCLCPP_ERROR(this->get_logger(), "FootstepPlanner has not set the start and/or goal pose yet.");
    return false;
  }

  if (force_new_plan || ivPlannerType == "RSTARPlanner" || ivPlannerType == "ARAPlanner")
  {
    reset();
  }
  return run();
}

bool FootstepPlanner::replan()
{
  return plan(false);
}

bool FootstepPlanner::plan(const geometry_msgs::msg::PoseStamped::SharedPtr start,
                           const geometry_msgs::msg::PoseStamped::SharedPtr goal)
{
  return plan(start->pose.position.x, start->pose.position.y,
              tf2::getYaw(start->pose.orientation),
              goal->pose.position.x, goal->pose.position.y,
              tf2::getYaw(goal->pose.orientation));
}

bool FootstepPlanner::plan(float start_x, float start_y, float start_theta,
                           float goal_x, float goal_y, float goal_theta)
{
  if (!(setStart(start_x, start_y, start_theta) &&
      setGoal(goal_x, goal_y, goal_theta)))
  {
    return false;
  }

  return plan(false);
}

bool FootstepPlanner::planService(const std::shared_ptr<humanoid_nav_msgs::srv::PlanFootsteps::Request> req,
                                  std::shared_ptr<humanoid_nav_msgs::srv::PlanFootsteps::Response> resp)
{
  bool result = plan(req->start.x, req->start.y, req->start.theta,
                     req->goal.x, req->goal.y, req->goal.theta);

  resp->costs = getPathCosts();
  resp->footsteps.reserve(getPathSize());
  resp->final_eps = ivPlannerPtr->get_final_epsilon();
  resp->expanded_states = ivPlannerEnvironmentPtr->getNumExpandedStates();
  extractFootstepsSrv(resp->footsteps);

  resp->result = result;

  return true;
}

bool FootstepPlanner::planFeetService(const std::shared_ptr<humanoid_nav_msgs::srv::PlanFootstepsBetweenFeet::Request> req,
                                      std::shared_ptr<humanoid_nav_msgs::srv::PlanFootstepsBetweenFeet::Response> resp)
{
  setStart(State(req->start_left.pose.x, req->start_left.pose.y, req->start_left.pose.theta, LEFT),
           State(req->start_right.pose.x, req->start_right.pose.y, req->start_right.pose.theta, RIGHT));
  setGoal(State(req->goal_left.pose.x, req->goal_left.pose.y, req->goal_left.pose.theta, LEFT),
          State(req->goal_right.pose.x, req->goal_right.pose.y, req->goal_right.pose.theta, RIGHT));

  bool result = plan(false);

  resp->costs = getPathCosts();
  resp->footsteps.reserve(getPathSize());
  resp->final_eps = ivPlannerPtr->get_final_epsilon();
  resp->expanded_states = ivPlannerEnvironmentPtr->getNumExpandedStates();
  extractFootstepsSrv(resp->footsteps);

  resp->result = result;

  return true;
}

void FootstepPlanner::extractFootstepsSrv(std::vector<humanoid_nav_msgs::msg::StepTarget> & footsteps) const
{
  humanoid_nav_msgs::msg::StepTarget foot;
  state_iter_t path_iter;
  for (path_iter = getPathBegin(); path_iter != getPathEnd(); ++path_iter)
  {
    foot.pose.x = path_iter->getX();
    foot.pose.y = path_iter->getY();
    foot.pose.theta = path_iter->getTheta();
    if (path_iter->getLeg() == LEFT)
      foot.leg = humanoid_nav_msgs::msg::StepTarget::LEFT;
    else if (path_iter->getLeg() == RIGHT)
      foot.leg = humanoid_nav_msgs::msg::StepTarget::RIGHT;
    else
    {
      RCLCPP_ERROR(this->get_logger(), "Footstep pose at (%f, %f, %f) is set to NOLEG!",
                   path_iter->getX(), path_iter->getY(),
                   path_iter->getTheta());
      continue;
    }

    footsteps.push_back(foot);
  }
}

void FootstepPlanner::goalPoseCallback(
    const geometry_msgs::msg::PoseStamped::SharedPtr goal_pose)
{
  if (setGoal(goal_pose))
  {
    if (ivStartPoseSetUp)
    {
      plan(!ivEnvironmentParams.forward_search);
    }
  }
}

void FootstepPlanner::startPoseCallback(
    const geometry_msgs::msg::PoseWithCovarianceStamped::SharedPtr start_pose)
{
  if (setStart(start_pose->pose.pose.position.x,
               start_pose->pose.pose.position.y,
               tf2::getYaw(start_pose->pose.pose.orientation)))
  {
    if (ivGoalPoseSetUp)
    {
      plan(ivEnvironmentParams.forward_search);
    }
  }
}

void FootstepPlanner::mapCallback(
    const nav_msgs::msg::OccupancyGrid::SharedPtr occupancy_map)
{
  GridMap2DPtr map(new GridMap2D(occupancy_map));

  if (updateMap(map))
  {
    plan(false);
  }
}

bool FootstepPlanner::setGoal(const geometry_msgs::msg::PoseStamped::SharedPtr goal_pose)
{
  return setGoal(goal_pose->pose.position.x,
                 goal_pose->pose.position.y,
                 tf2::getYaw(goal_pose->pose.orientation));
}

bool FootstepPlanner::setGoal(float x, float y, float theta)
{
  if (!ivMapPtr)
  {
    RCLCPP_ERROR(this->get_logger(), "Distance map hasn't been initialized yet.");
    return false;
  }

  State goal(x, y, theta, NOLEG);
  State foot_left = getFootPose(goal, LEFT);
  State foot_right = getFootPose(goal, RIGHT);

  if (ivPlannerEnvironmentPtr->occupied(foot_left) ||
      ivPlannerEnvironmentPtr->occupied(foot_right))
  {
    RCLCPP_ERROR(this->get_logger(), "Goal pose at (%f %f %f) not accessible.", x, y, theta);
    ivGoalPoseSetUp = false;
    return false;
  }
  ivGoalFootLeft = foot_left;
  ivGoalFootRight = foot_right;

  ivGoalPoseSetUp = true;
  RCLCPP_INFO(this->get_logger(), "Goal pose set to (%f %f %f)", x, y, theta);

  return true;
}

bool FootstepPlanner::setGoal(const State& left_foot, const State& right_foot)
{
  if (ivPlannerEnvironmentPtr->occupied(left_foot) ||
      ivPlannerEnvironmentPtr->occupied(right_foot))
  {
    ivGoalPoseSetUp = false;
    return false;
  }
  ivGoalFootLeft = left_foot;
  ivGoalFootRight = right_foot;

  ivGoalPoseSetUp = true;

  return true;
}


bool FootstepPlanner::setStart(const geometry_msgs::msg::PoseStamped::SharedPtr start_pose)
{
  return setStart(start_pose->pose.position.x,
                  start_pose->pose.position.y,
                  tf2::getYaw(start_pose->pose.orientation));
}

bool FootstepPlanner::setStart(const State& left_foot, const State& right_foot)
{
  if (ivPlannerEnvironmentPtr->occupied(left_foot) ||
      ivPlannerEnvironmentPtr->occupied(right_foot))
  {
    ivStartPoseSetUp = false;
    return false;
  }
  ivStartFootLeft = left_foot;
  ivStartFootRight = right_foot;

  ivStartPoseSetUp = true;

  return true;
}

bool FootstepPlanner::setStart(float x, float y, float theta)
{
  if (!ivMapPtr)
  {
    RCLCPP_ERROR(this->get_logger(), "Distance map hasn't been initialized yet.");
    return false;
  }

  State start(x, y, theta, NOLEG);
  State foot_left = getFootPose(start, LEFT);
  State foot_right = getFootPose(start, RIGHT);

  bool success = setStart(foot_left, foot_right);
  if (success)
    RCLCPP_INFO(this->get_logger(), "Start pose set to (%f %f %f)", x, y, theta);
  else
    RCLCPP_ERROR(this->get_logger(), "Start pose (%f %f %f) not accessible.", x, y, theta);

  // publish visualization:
  geometry_msgs::msg::PoseStamped start_pose;
  tf2::Quaternion q;
  q.setRPY(0, 0, theta);  // Proper way to set from Euler angles
  start_pose.pose.position.x = x;
  start_pose.pose.position.y = y;
  start_pose.pose.position.z = 0.025;
  // start_pose.pose.orientation = tf2::toMsg(tf2::Quaternion(0, 0, theta));
  start_pose.pose.orientation = tf2::toMsg(q); 
  start_pose.header.frame_id = ivMapPtr->getFrameID();
  start_pose.header.stamp = this->now();
  ivStartPoseVisPub->publish(start_pose);

  return success;
}

bool FootstepPlanner::updateMap(const GridMap2DPtr map)
{
  // store old map pointer locally
  GridMap2DPtr old_map = ivMapPtr;
  // store new map
  ivMapPtr.reset();
  ivMapPtr = map;

  // check if a previous map and a path existed
  if (old_map && (bool)ivPath.size())
  {
    updateEnvironment(old_map);
    return true;
  }

  // ..otherwise the environment's map can simply be updated
  ivPlannerEnvironmentPtr->updateMap(map);
  return false;
}

void FootstepPlanner::updateEnvironment(const GridMap2DPtr old_map)
{
  RCLCPP_INFO(this->get_logger(), "Reseting the planning environment.");
  // reset environment
  resetTotally();
  // set the new map
  ivPlannerEnvironmentPtr->updateMap(ivMapPtr);
}


State FootstepPlanner::getFootPose(const State& robot, Leg leg)
{
  double shift_x = -sin(robot.getTheta()) * ivFootSeparation / 2.0;
  double shift_y =  cos(robot.getTheta()) * ivFootSeparation / 2.0;

  double sign = -1.0;
  if (leg == LEFT)
    sign = 1.0;

  return State(robot.getX() + sign * shift_x,
               robot.getY() + sign * shift_y,
               robot.getTheta(),
               leg);
}

bool FootstepPlanner::pathIsNew(const std::vector<int>& new_path)
{
  if (new_path.size() != ivPlanningStatesIds.size())
    return true;

  bool unequal = true;
  for (unsigned i = 0; i < new_path.size(); ++i)
    unequal = new_path[i] != ivPlanningStatesIds[i] && unequal;

  return unequal;
}

void FootstepPlanner::clearFootstepPathVis(unsigned num_footsteps)
{
  visualization_msgs::msg::Marker marker;
  visualization_msgs::msg::MarkerArray marker_msg;

  marker.header.stamp = this->now();
  marker.header.frame_id = ivMapPtr->getFrameID();

  if (num_footsteps < 1)
    num_footsteps = ivLastMarkerMsgSize;

  for (unsigned i = 0; i < num_footsteps; ++i)
  {
    marker.ns = ivMarkerNamespace;
    marker.id = i;
    marker.action = visualization_msgs::msg::Marker::DELETE;

    marker_msg.markers.push_back(marker);
  }

  ivFootstepPathVisPub->publish(marker_msg);
}

void FootstepPlanner::broadcastExpandedNodesVis()
{
  if (ivExpandedStatesVisPub->get_subscription_count() > 0)
  {
    sensor_msgs::msg::PointCloud cloud_msg;
    geometry_msgs::msg::Point32 point;
    std::vector<geometry_msgs::msg::Point32> points;

    State s;
    FootstepPlannerEnvironment::exp_states_2d_iter_t state_id_it;
    for(state_id_it = ivPlannerEnvironmentPtr->getExpandedStatesStart();
        state_id_it != ivPlannerEnvironmentPtr->getExpandedStatesEnd();
        ++state_id_it)
    {
      point.x = cell_2_state(state_id_it->first,
                             ivEnvironmentParams.cell_size);
      point.y = cell_2_state(state_id_it->second,
                             ivEnvironmentParams.cell_size);
      point.z = 0.01;
      points.push_back(point);
    }
    cloud_msg.header.stamp = this->now();
    cloud_msg.header.frame_id = ivMapPtr->getFrameID();

    cloud_msg.points = points;

    ivExpandedStatesVisPub->publish(cloud_msg);
  }
}

void FootstepPlanner::broadcastFootstepPathVis()
{
  if (getPathSize() == 0)
  {
    RCLCPP_INFO(this->get_logger(), "no path has been extracted yet");
    return;
  }

  clearFootstepPathVis(0);

  visualization_msgs::msg::Marker marker;
  visualization_msgs::msg::MarkerArray broadcast_msg;
  std::vector<visualization_msgs::msg::Marker> markers;

  int markers_counter = 0;

  marker.header.stamp = this->now();
  marker.header.frame_id = ivMapPtr->getFrameID();

  // add the missing start foot to the publish vector for visualization:
  if (ivPath.front().getLeg() == LEFT)
    footPoseToMarker(ivStartFootRight, &marker);
  else
    footPoseToMarker(ivStartFootLeft, &marker);
  marker.id = markers_counter++;
  markers.push_back(marker);

  // add the footsteps of the path to the publish vector
  for(state_iter_t path_iter = getPathBegin(); path_iter != getPathEnd();
      ++path_iter)
  {
    footPoseToMarker(*path_iter, &marker);
    marker.id = markers_counter++;
    markers.push_back(marker);
  }

  broadcast_msg.markers = markers;
  ivLastMarkerMsgSize = markers.size();

  ivFootstepPathVisPub->publish(broadcast_msg);
}


void FootstepPlanner::broadcastRandomNodesVis()
{
  if (ivRandomStatesVisPub->get_subscription_count() > 0)
  {
    sensor_msgs::msg::PointCloud cloud_msg;
    geometry_msgs::msg::Point32 point;
    std::vector<geometry_msgs::msg::Point32> points;
    visualization_msgs::msg::Marker marker;
    visualization_msgs::msg::MarkerArray broadcast_msg;
    std::vector<visualization_msgs::msg::Marker> markers;

    marker.header.stamp = this->now();
    marker.header.frame_id = ivMapPtr->getFrameID();

    State s;
    FootstepPlannerEnvironment::exp_states_iter_t state_id_iter;
    for(state_id_iter = ivPlannerEnvironmentPtr->getRandomStatesStart();
        state_id_iter != ivPlannerEnvironmentPtr->getRandomStatesEnd();
        ++state_id_iter)
    {
      if (!ivPlannerEnvironmentPtr->getState(*state_id_iter, &s))
      {
        RCLCPP_WARN(this->get_logger(), "Could not get random state %d", *state_id_iter);
      }
      else
      {
        point.x = s.getX();
        point.y = s.getY();
        point.z = 0.01;
        points.push_back(point);
      }
    }
    cloud_msg.header.stamp = this->now();
    cloud_msg.header.frame_id = ivMapPtr->getFrameID();

    cloud_msg.points = points;

    ivRandomStatesVisPub->publish(cloud_msg);
  }
}

void FootstepPlanner::broadcastPathVis()
{
  if (getPathSize() == 0)
  {
    RCLCPP_INFO(this->get_logger(), "no path has been extracted yet");
    return;
  }

  nav_msgs::msg::Path path_msg;
  geometry_msgs::msg::PoseStamped state;

  state.header.stamp = this->now();
  state.header.frame_id = ivMapPtr->getFrameID();

  state_iter_t path_iter;
  for(path_iter = getPathBegin(); path_iter != getPathEnd(); ++path_iter)
  {
    state.pose.position.x = path_iter->getX();
    state.pose.position.y = path_iter->getY();
    path_msg.poses.push_back(state);
  }

  path_msg.header = state.header;
  ivPathVisPub->publish(path_msg);
}

void FootstepPlanner::footPoseToMarker(const State& foot_pose,
                                       visualization_msgs::msg::Marker* marker)
{
  marker->header.stamp = this->now();
  marker->header.frame_id = ivMapPtr->getFrameID();
  marker->ns = ivMarkerNamespace;
  marker->type = visualization_msgs::msg::Marker::CUBE;
  marker->action = visualization_msgs::msg::Marker::ADD;

  float cos_theta = cos(foot_pose.getTheta());
  float sin_theta = sin(foot_pose.getTheta());
  float x_shift = cos_theta * ivEnvironmentParams.foot_origin_shift_x -
                  sin_theta * ivEnvironmentParams.foot_origin_shift_y;
  float y_shift;
  if (foot_pose.getLeg() == LEFT)
    y_shift = sin_theta * ivEnvironmentParams.foot_origin_shift_x +
              cos_theta * ivEnvironmentParams.foot_origin_shift_y;
  else // leg == RLEG
    y_shift = sin_theta * ivEnvironmentParams.foot_origin_shift_x -
              cos_theta * ivEnvironmentParams.foot_origin_shift_y;
  marker->pose.position.x = foot_pose.getX() + x_shift;
  marker->pose.position.y = foot_pose.getY() + y_shift;
  marker->pose.position.z = ivEnvironmentParams.footsize_z / 2.0;
  // marker->pose.orientation = tf2::toMsg(tf2::Quaternion(0, 0, foot_pose.getTheta()));
  tf2::Quaternion q;
  q.setRPY(0, 0, foot_pose.getTheta());
  marker->pose.orientation = tf2::toMsg(q);
  marker->scale.x = ivEnvironmentParams.footsize_x;
  marker->scale.y = ivEnvironmentParams.footsize_y;
  marker->scale.z = ivEnvironmentParams.footsize_z;

  if (foot_pose.getLeg() == RIGHT)
  {
    marker->color.r = 0.0f;
    marker->color.g = 1.0f;
  }
  else // leg == LEFT
  {
    marker->color.r = 1.0f;
    marker->color.g = 0.0f;
  }
  marker->color.b = 0.0;
  marker->color.a = 0.6;

  marker->lifetime = rclcpp::Duration::from_seconds(0);
}
}
