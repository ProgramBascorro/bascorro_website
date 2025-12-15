#ifndef FOOTSTEP_PLANNER_FOOTSTEPPLANNERENVIRONMENT_H_
#define FOOTSTEP_PLANNER_FOOTSTEPPLANNERENVIRONMENT_H_

#include <footstep_planner/helper.h>
#include <footstep_planner/PathCostHeuristic.h>
#include <footstep_planner/Heuristic.h>
#include <footstep_planner/Footstep.h>
#include <footstep_planner/PlanningState.h>
#include <footstep_planner/State.h>
#include <humanoid_nav_msgs/srv/clip_footstep.hpp>
#include <sbpl/headers.h>
#include <math.h>
#include <vector>
#include <unordered_set>
#include <unordered_map>

namespace footstep_planner
{
struct environment_params
{
  std::vector<Footstep> footstep_set;
  std::shared_ptr<Heuristic> heuristic;
  std::vector<std::pair<int, int>> step_range;
  double footsize_x, footsize_y, footsize_z;
  double foot_origin_shift_x, foot_origin_shift_y;
  double max_footstep_x, max_footstep_y, max_footstep_theta;
  double max_inverse_footstep_x, max_inverse_footstep_y, max_inverse_footstep_theta;
  double step_cost;
  int collision_check_accuracy;
  int hash_table_size;
  double cell_size;
  int num_angle_bins;
  bool forward_search;
  double max_step_width;
  int num_random_nodes;
  double random_node_distance;
  double heuristic_scale;
};

class FootstepPlannerEnvironment : public DiscreteSpaceInformation
{
public:
  struct IntPairHash{
  public:
    size_t operator()(std::pair<int, int> x) const throw() {
      size_t seed = std::hash<int>()(x.first);
      return std::hash<int>()(x.second) + 0x9e3779b9 + (seed<<6) + (seed>>2);
    }
  };

  typedef std::vector<int> exp_states_t;
  typedef exp_states_t::const_iterator exp_states_iter_t;
  typedef std::unordered_set<std::pair<int,int>, IntPairHash> exp_states_2d_t;
  typedef exp_states_2d_t::const_iterator exp_states_2d_iter_t;

  FootstepPlannerEnvironment(const environment_params& params);
  virtual ~FootstepPlannerEnvironment();

  std::pair<int, int> updateGoal(const State& foot_left, const State& foot_right);
  std::pair<int, int> updateStart(const State& foot_left, const State& right_right);
  void updateMap(gridmap_2d::GridMap2DPtr map);
  bool occupied(const State& s);
  bool getState(unsigned int id, State* s);
  void reset();
  int getNumExpandedStates() { return ivNumExpandedStates; }
  exp_states_2d_iter_t getExpandedStatesStart() { return ivExpandedStates.begin(); }
  exp_states_2d_iter_t getExpandedStatesEnd() { return ivExpandedStates.end(); }
  exp_states_iter_t getRandomStatesStart() { return ivRandomStates.begin(); }
  exp_states_iter_t getRandomStatesEnd() { return ivRandomStates.end(); }
  int GetFromToHeuristic(int FromStateID, int ToStateID);
  int GetGoalHeuristic(int stateID);
  int GetStartHeuristic(int stateID);
  void GetSuccs(int SourceStateID, std::vector<int> *SuccIDV, std::vector<int> *CostV);
  void GetPreds(int TargetStateID, std::vector<int> *PredIDV, std::vector<int> *CostV);
  virtual void GetRandomSuccsatDistance(int SourceStateID, std::vector<int>* SuccIDV, std::vector<int>* CLowV);
  virtual void GetRandomPredsatDistance(int TargetStateID, std::vector<int>* PredIDV, std::vector<int>* CLowV);
  void GetSuccsTo(int SourceStateID, int goalStateID, std::vector<int> *SuccIDV, std::vector<int> *CostV);
  bool AreEquivalent(int StateID1, int StateID2);
  bool InitializeEnv(const char *sEnvFile);
  bool InitializeMDPCfg(MDPConfig *MDPCfg);
  void PrintEnv_Config(FILE *fOut);
  void PrintState(int stateID, bool bVerbose, FILE *fOut);
  void SetAllActionsandAllOutcomes(CMDPSTATE *state);
  void SetAllPreds(CMDPSTATE *state);
  int SizeofCreatedEnv();
  bool reachable(const PlanningState& from, const PlanningState& to);
  void getPredsOfGridCells(const std::vector<State>& changed_states, std::vector<int>* pred_ids);
  void getSuccsOfGridCells(const std::vector<State>& changed_states, std::vector<int>* succ_ids);
  void updateHeuristicValues();
  static const int cvMmScale = 1000;

protected:
  int GetFromToHeuristic(const PlanningState& from, const PlanningState& to);
  int stepCost(const PlanningState& a, const PlanningState& b);
  bool occupied(const PlanningState& s);
  void GetRandomNeighs(const PlanningState* currentState, std::vector<int>* NeighIDV, std::vector<int>* CLowV, int nNumofNeighs, int nDist_c, bool bSuccs);
  void setStateArea(const PlanningState& left, const PlanningState& right);
  const PlanningState* createNewHashEntry(const State& s);
  const PlanningState* createNewHashEntry(const PlanningState& s);
  const PlanningState* getHashEntry(const State& s);
  const PlanningState* getHashEntry(const PlanningState& s);
  const PlanningState* createHashEntryIfNotExists(const PlanningState& s);
  bool closeToGoal(const PlanningState& from);
  bool closeToStart(const PlanningState& from);

  struct less
  {
    bool operator ()(const PlanningState* a, const PlanningState* b) const;
  };

  int ivIdPlanningGoal;
  int ivIdStartFootLeft;
  int ivIdStartFootRight;
  int ivIdGoalFootLeft;
  int ivIdGoalFootRight;
  std::vector<int> ivStateArea;
  std::vector<const PlanningState*> ivStateId2State;
  std::vector<const PlanningState*>* ivpStateHash2State;
  const std::vector<Footstep>& ivFootstepSet;
  const std::shared_ptr<Heuristic> ivHeuristicConstPtr;
  const double ivFootsizeX;
  const double ivFootsizeY;
  const double ivOriginFootShiftX;
  const double ivOriginFootShiftY;
  const int ivMaxFootstepX;
  const int ivMaxFootstepY;
  int ivMaxFootstepTheta;
  const int ivMaxInvFootstepX;
  const int ivMaxInvFootstepY;
  int ivMaxInvFootstepTheta;
  const int ivStepCost;
  const int ivCollisionCheckAccuracy;
  const int ivHashTableSize;
  const double ivCellSize;
  const int ivNumAngleBins;
  const bool ivForwardSearch;
  double ivMaxStepWidth;
  const int ivNumRandomNodes;
  const int ivRandomNodeDist;
  double ivHeuristicScale;
  bool ivHeuristicExpired;
  std::shared_ptr<gridmap_2d::GridMap2D> ivMapPtr;
  exp_states_2d_t ivExpandedStates;
  exp_states_t ivRandomStates;
  size_t ivNumExpandedStates;
  bool* ivpStepRange;
};
}

#endif  // FOOTSTEP_PLANNER_FOOTSTEPPLANNERENVIRONMENT_H_