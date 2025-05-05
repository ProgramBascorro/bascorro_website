#include <footstep_planner/helper.h>

namespace footstep_planner
{
bool collision_check(double x, double y, double theta, double height,
                     double width, int accuracy,
                     const gridmap_2d::GridMap2D& distance_map)
{
  double d = distance_map.distanceMapAt(x, y);
  if (d < 0.0) // if out of bounds => collision
    return true;
  d -= distance_map.getResolution();

  const double r_o = sqrt(width * width + height * height) / 2.0;

  if (d >= r_o)
    return false;
  else if (accuracy == 0)
    return false;

  const double h_half = height / 2.0;
  const double w_half = width / 2.0;
  const double r_i = std::min(w_half, h_half);

  if (d <= r_i)
    return true;
  else if (accuracy == 1)
    return true;

  double h_new;
  double w_new;
  double delta_x;
  double delta_y;
  if (width < height)
  {
    const double h_clear = sqrt(d * d - w_half * w_half);
    h_new = h_half - h_clear;
    w_new = width;
    delta_x = h_clear + h_new / 2.0;
    delta_y = 0.0;
  }
  else // footWidth >= footHeight
  {
    const double w_clear = sqrt(d * d - h_half * h_half);
    h_new = height;
    w_new = w_half - w_clear;
    delta_x = 0.0;
    delta_y = w_clear + w_new / 2.0;
  }
  const double theta_cos = cos(theta);
  const double theta_sin = sin(theta);
  const double x_shift = theta_cos * delta_x - theta_sin * delta_y;
  const double y_shift = theta_sin * delta_x + theta_cos * delta_y;

  return (collision_check(x + x_shift, y + y_shift, theta, h_new, w_new,
                          accuracy, distance_map) ||
          collision_check(x - x_shift, y - y_shift, theta, h_new, w_new,
                          accuracy, distance_map));
}

bool pointWithinPolygon(int x, int y, const std::vector<std::pair<int, int>>& edges)
{
  int cn = 0;

  for (unsigned int i = 0; i < edges.size() - 1; ++i)
  {
    if ((edges[i].second <= y && edges[i + 1].second > y) ||
        (edges[i].second > y && edges[i + 1].second <= y))
    {
      float vt = (float)(y - edges[i].second) /
                 (edges[i + 1].second - edges[i].second);
      if (x < edges[i].first + vt * (edges[i + 1].first - edges[i].first))
      {
        ++cn;
      }
    }
  }
  return cn & 1;
}
}