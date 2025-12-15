#ifndef FOOTSTEP_PLANNER_PATHCOSTHEURISTIC_H_
#define FOOTSTEP_PLANNER_PATHCOSTHEURISTIC_H_

#include <footstep_planner/Heuristic.h>
#include <gridmap_2d/GridMap2D.h>
#include <sbpl/headers.h>

namespace footstep_planner
{
class PathCostHeuristic : public Heuristic
{
public:
  PathCostHeuristic(double cell_size, int num_angle_bins,
                    double step_cost, double diff_angle_cost,
                    double max_step_width, double inflation_radius);
  virtual ~PathCostHeuristic();

  virtual double getHValue(const PlanningState& current,
                           const PlanningState& to) const;

  bool calculateDistances(const PlanningState& from, const PlanningState& to);

  void updateMap(gridmap_2d::GridMap2DPtr map);

private:
  static const int cvObstacleThreshold = 200;

  unsigned char** ivpGrid;

  double ivStepCost;
  double ivDiffAngleCost;
  double ivMaxStepWidth;
  double ivInflationRadius;

  int ivGoalX;
  int ivGoalY;

  gridmap_2d::GridMap2DPtr ivMapPtr;
  std::shared_ptr<SBPL2DGridSearch> ivGridSearchPtr;

  void resetGrid();
};
}
#endif  // FOOTSTEP_PLANNER_PATHCOSTHEURISTIC_H_