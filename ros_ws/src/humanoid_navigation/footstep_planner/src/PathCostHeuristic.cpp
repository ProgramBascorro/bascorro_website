#include <footstep_planner/PathCostHeuristic.h>
#include <rclcpp/rclcpp.hpp>

namespace footstep_planner
{
PathCostHeuristic::PathCostHeuristic(double cell_size,
                                     int    num_angle_bins,
                                     double step_cost,
                                     double diff_angle_cost,
                                     double max_step_width,
                                     double inflation_radius)
: Heuristic(cell_size, num_angle_bins, PATH_COST),
  ivpGrid(NULL),
  ivStepCost(step_cost),
  ivDiffAngleCost(diff_angle_cost),
  ivMaxStepWidth(max_step_width),
  ivInflationRadius(inflation_radius),
  ivGoalX(-1),
  ivGoalY(-1)
{}

PathCostHeuristic::~PathCostHeuristic()
{
  if (ivpGrid)
    resetGrid();
}

double PathCostHeuristic::getHValue(const PlanningState& current,
                                    const PlanningState& to) const
{
  assert(ivGoalX >= 0 && ivGoalY >= 0);

  if (current == to)
    return 0.0;

  unsigned int from_x;
  unsigned int from_y;
  ivMapPtr->worldToMapNoBounds(cell_2_state(current.getX(), ivCellSize),
                               cell_2_state(current.getY(), ivCellSize),
                               from_x, from_y);

  unsigned int to_x;
  unsigned int to_y;
  ivMapPtr->worldToMapNoBounds(cell_2_state(to.getX(), ivCellSize),
                               cell_2_state(to.getY(), ivCellSize),
                               to_x, to_y);

  if ((unsigned int)ivGoalX != to_x || (unsigned int)ivGoalY != to_y)
  {
    RCLCPP_ERROR(rclcpp::get_logger("PathCostHeuristic"), "PathCostHeuristic::getHValue to a different value than precomputed, heuristic values will be wrong. You need to call calculateDistances() before!");
  }
  assert((unsigned int)ivGoalX == to_x && (unsigned int)ivGoalY == to_y);

  double dist = double(ivGridSearchPtr->getlowerboundoncostfromstart_inmm(
      from_x, from_y)) / 1000.0;

  double expected_steps = dist / ivMaxStepWidth;
  double diff_angle = 0.0;
  if (ivDiffAngleCost > 0.0)
  {
    int diff_angle_disc = (
        ((to.getTheta() - current.getTheta()) % ivNumAngleBins) +
        ivNumAngleBins) % ivNumAngleBins;
    diff_angle = std::abs(angles::normalize_angle(
        angle_cell_2_state(diff_angle_disc, ivNumAngleBins)));
  }

  return (dist + expected_steps * ivStepCost + diff_angle * ivDiffAngleCost);
}

bool PathCostHeuristic::calculateDistances(const PlanningState& from,
                                           const PlanningState& to)
{
  assert(ivMapPtr);

  unsigned int from_x;
  unsigned int from_y;
  ivMapPtr->worldToMapNoBounds(cell_2_state(from.getX(), ivCellSize),
                               cell_2_state(from.getY(), ivCellSize),
                               from_x, from_y);

  unsigned int to_x;
  unsigned int to_y;
  ivMapPtr->worldToMapNoBounds(cell_2_state(to.getX(), ivCellSize),
                               cell_2_state(to.getY(), ivCellSize),
                               to_x, to_y);

  if ((int)to_x != ivGoalX || (int)to_y != ivGoalY)
  {
    ivGoalX = to_x;
    ivGoalY = to_y;
    ivGridSearchPtr->search(ivpGrid, cvObstacleThreshold,
                            ivGoalX, ivGoalY, from_x, from_y,
                            SBPL_2DGRIDSEARCH_TERM_CONDITION_ALLCELLS);
  }

  return true;
}

void PathCostHeuristic::updateMap(gridmap_2d::GridMap2DPtr map)
{
  if (ivpGrid)
    resetGrid();

  ivMapPtr.reset();
  ivMapPtr = map;

  ivGoalX = ivGoalY = -1;

  unsigned width = ivMapPtr->getInfo().width;
  unsigned height = ivMapPtr->getInfo().height;

  if (ivGridSearchPtr)
    ivGridSearchPtr->destroy();
  ivGridSearchPtr.reset(new SBPL2DGridSearch(width, height,
                                             ivMapPtr->getResolution()));

  ivpGrid = new unsigned char* [width];

  for (unsigned x = 0; x < width; ++x)
    ivpGrid[x] = new unsigned char [height];
  for (unsigned y = 0; y < height; ++y)
  {
    for (unsigned x = 0; x < width; ++x)
    {
      float dist = ivMapPtr->distanceMapAtCell(x,y);
      if (dist < 0.0f)
        RCLCPP_ERROR(rclcpp::get_logger("PathCostHeuristic"), "Distance map at %d %d out of bounds", x, y);
      else if (dist <= ivInflationRadius)
        ivpGrid[x][y] = 255;
      else
        ivpGrid[x][y] = 0;
    }
  }
}

void PathCostHeuristic::resetGrid()
{
  int width = ivMapPtr->getInfo().width;
  for (int x = 0; x < width; ++x)
  {
    if (ivpGrid[x])
    {
      delete[] ivpGrid[x];
      ivpGrid[x] = NULL;
    }
  }
  delete[] ivpGrid;
  ivpGrid = NULL;
}
}