#ifndef FOOTSTEP_PLANNER_PLANNINGSTATE_H_
#define FOOTSTEP_PLANNER_PLANNINGSTATE_H_

#include <footstep_planner/helper.h>
#include <footstep_planner/State.h>

namespace footstep_planner
{
class PlanningState
{
public:
  PlanningState(double x, double y, double theta, Leg leg,
                double cell_size, int num_angle_bins, int max_hash_size);

  PlanningState(int x, int y, int theta, Leg leg, int max_hash_size);

  PlanningState(const State& s, double cell_size, int num_angle_bins,
                int max_hash_size);

  PlanningState(const PlanningState& s);

  ~PlanningState();

  bool operator ==(const PlanningState& s2) const;

  bool operator !=(const PlanningState& s2) const;

  void setId(unsigned int id) { ivId = id; }

  Leg getLeg() const { return ivLeg; }
  int getTheta() const { return ivTheta; }
  int getX() const { return ivX; }
  int getY() const { return ivY; }

  unsigned int getHashTag() const { return ivHashTag; }

  int getId() const { return ivId; }

  State getState(double cell_size, int num_angle_bins) const;

private:
  int ivX;
  int ivY;
  int ivTheta;
  Leg ivLeg;
  int ivId;
  unsigned int ivHashTag;
};
}
#endif  // FOOTSTEP_PLANNER_PLANNINGSTATE_H_