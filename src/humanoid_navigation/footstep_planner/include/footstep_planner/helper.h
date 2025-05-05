#ifndef FOOTSTEP_PLANNER_HELPER_H_
#define FOOTSTEP_PLANNER_HELPER_H_

#define DEBUG_HASH 0
#define DEBUG_TIME 0

#include <gridmap_2d/GridMap2D.h>
#include <angles/angles.h>
#include <tf2/LinearMath/Transform.h>
#include <math.h>

namespace footstep_planner
{
static const double TWO_PI = 2 * M_PI;
static const double FLOAT_CMP_THR = 0.0001;

enum Leg { RIGHT=0, LEFT=1, NOLEG=2 };

inline double euclidean_distance_sq(int x1, int y1, int x2, int y2)
{
  return (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2);
}

inline double euclidean_distance(int x1, int y1, int x2, int y2)
{
  return sqrt(double(euclidean_distance_sq(x1, y1, x2, y2)));
}

inline double euclidean_distance(double x1, double y1, double x2, double y2)
{
  return sqrt(euclidean_distance_sq(x1, y1, x2, y2));
}

inline double euclidean_distance_sq(double x1, double y1, double x2, double y2)
{
  return (x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2);
}

inline double grid_cost(int x1, int y1, int x2, int y2, float cell_size)
{
  int x = abs(x1 - x2);
  int y = abs(y1 - y2);

  if (x + y > 1)
    return M_SQRT2 * cell_size;
  else
    return cell_size;
}

inline int angle_state_2_cell(double angle, int angle_bin_num)
{
  double bin_size_half = M_PI / angle_bin_num;
  return int(angles::normalize_angle_positive(angle + bin_size_half) /
             TWO_PI * angle_bin_num);
}

inline double angle_cell_2_state(int angle, int angle_bin_num)
{
  double bin_size = TWO_PI / angle_bin_num;
  return angle * bin_size;
}

inline int state_2_cell(float value, float cell_size)
{
  return value >= 0 ? int(value / cell_size) : int(value / cell_size) - 1;
}

inline double cell_2_state(int value, double cell_size)
{
  return (double(value) + 0.5) * cell_size;
}

inline int disc_val(double length, double cell_size)
{
  return int(floor((length / cell_size) + 0.5));
}

inline double cont_val(int length, double cell_size)
{
  return double(length * cell_size);
}

inline unsigned int int_hash(int key)
{
  key += (key << 12);
  key ^= (key >> 22);
  key += (key << 4);
  key ^= (key >> 9);
  key += (key << 10);
  key ^= (key >> 2);
  key += (key << 7);
  key ^= (key >> 12);
  return key;
}

inline unsigned int calc_hash_tag(int x, int y, int theta, int leg,
                                  int max_hash_size)
{
  return int_hash((int_hash(x) << 3) + (int_hash(y) << 2) +
                  (int_hash(theta) << 1) + (int_hash(leg)))
      % max_hash_size;
}

inline int round(double r)
{
  return (r > 0.0) ? floor(r + 0.5) : ceil(r - 0.5);
}

bool collision_check(double x, double y, double theta,
                     double height, double width, int accuracy,
                     const gridmap_2d::GridMap2D& distance_map);

bool pointWithinPolygon(int x, int y,
                        const std::vector<std::pair<int, int> >& edges);
}
#endif  /* FOOTSTEP_PLANNER_HELPER_H_ */