#ifndef FOOTSTEP_PLANNER_HEURISTIC_H_
#define FOOTSTEP_PLANNER_HEURISTIC_H_

#include <footstep_planner/helper.h>
#include <footstep_planner/PlanningState.h>

namespace footstep_planner
{
class Heuristic
{
public:
  enum HeuristicType { EUCLIDEAN=0, EUCLIDEAN_STEPCOST=1, PATH_COST=2 };

  Heuristic(double cell_size, int num_angle_bins, HeuristicType type);
  virtual ~Heuristic();

  virtual double getHValue(const PlanningState& from,
                           const PlanningState& to) const = 0;

  HeuristicType getHeuristicType() const { return ivHeuristicType; }

protected:
  double ivCellSize;
  int    ivNumAngleBins;

  const HeuristicType ivHeuristicType;
};

class EuclideanHeuristic : public Heuristic
{
public:
  EuclideanHeuristic(double cell_size, int num_angle_bins);
  virtual ~EuclideanHeuristic();

  virtual double getHValue(const PlanningState& from,
                           const PlanningState& to) const;
};

class EuclStepCostHeuristic : public Heuristic
{
public:
  EuclStepCostHeuristic(double cell_size, int num_angle_bins,
                        double step_cost, double diff_angle_cost,
                        double max_step_width);
  virtual ~EuclStepCostHeuristic();

  virtual double getHValue(const PlanningState& from,
                           const PlanningState& to) const;

private:
  const double ivStepCost;
  const double ivDiffAngleCost;
  const double ivMaxStepWidth;
};
}
#endif  // FOOTSTEP_PLANNER_HEURISTIC_H_