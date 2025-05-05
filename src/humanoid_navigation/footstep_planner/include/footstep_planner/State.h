#ifndef FOOTSTEP_PLANNER_STATE_H_
#define FOOTSTEP_PLANNER_STATE_H_

#include <footstep_planner/helper.h>

namespace footstep_planner
{
class State
{
public:
  State();
  State(double x, double y, double theta, Leg leg);
  ~State();

  void setX(double x) { ivX = x; }
  void setY(double y) { ivY = y; }
  void setTheta(double theta) { ivTheta = theta; }
  void setLeg(Leg leg) { ivLeg = leg; }

  double getX() const { return ivX; }
  double getY() const { return ivY; }
  double getTheta() const { return ivTheta; }
  Leg getLeg() const { return ivLeg; }

  bool operator ==(const State& s2) const;
  bool operator !=(const State& s2) const;

private:
  double ivX;
  double ivY;
  double ivTheta;
  Leg ivLeg;
};
}
#endif /* FOOTSTEP_PLANNER_STATE_H_ */