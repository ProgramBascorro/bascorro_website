#ifndef FOOTSTEP_PLANNER_FOOTSTEP_H_
#define FOOTSTEP_PLANNER_FOOTSTEP_H_

#include <footstep_planner/PlanningState.h>
#include <vector>
#include <utility>

namespace footstep_planner
{

class Footstep
{
public:
  Footstep(double x, double y, double theta,
           double cell_size, int num_angle_bins, int max_hash_size);
  ~Footstep();

  PlanningState performMeOnThisState(const PlanningState& current) const;
  PlanningState reverseMeOnThisState(const PlanningState& current) const;

private:
  typedef std::pair<int, int> footstep_xy;

  void init(double x, double y);

  int calculateForwardStep(Leg leg, int global_theta,
                           double x, double y,
                           int* footstep_x, int* footstep_y) const;

  int ivTheta;
  double ivCellSize;
  int ivNumAngleBins;
  int ivMaxHashSize;

  std::vector<footstep_xy> ivDiscSuccessorLeft;
  std::vector<footstep_xy> ivDiscSuccessorRight;
  std::vector<footstep_xy> ivDiscPredecessorLeft;
  std::vector<footstep_xy> ivDiscPredecessorRight;
};

} // end of namespace

#endif  // FOOTSTEP_PLANNER_FOOTSTEP_H_