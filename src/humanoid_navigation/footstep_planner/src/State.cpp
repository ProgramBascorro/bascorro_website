#include <footstep_planner/State.h>

namespace footstep_planner
{
State::State()
: ivX(0.0), ivY(0.0), ivTheta(0.0), ivLeg(NOLEG)
{}

State::State(double x, double y, double theta, Leg leg)
: ivX(x), ivY(y), ivTheta(theta), ivLeg(leg)
{}

State::~State()
{}

bool State::operator ==(const State& s2) const
{
  return (fabs(ivX - s2.getX()) < FLOAT_CMP_THR &&
      fabs(ivY - s2.getY()) < FLOAT_CMP_THR &&
      fabs(angles::shortest_angular_distance(ivTheta, s2.getTheta()))
  < FLOAT_CMP_THR &&
  ivLeg == s2.getLeg());
}

bool State::operator !=(const State& s2) const
{
  return not (*this == s2);
}
}