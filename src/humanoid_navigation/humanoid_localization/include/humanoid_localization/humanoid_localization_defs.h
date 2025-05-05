#ifndef HUMANOID_LOCALIZATION_HUMANOID_LOCALIZATION_DEFS_H_
#define HUMANOID_LOCALIZATION_HUMANOID_LOCALIZATION_DEFS_H_

#include <vector>
#include <random>
#include <tf2/LinearMath/Transform.hpp>
#include <Eigen/Core>
#include <sensor_msgs/point_cloud2_iterator.hpp>
#include <pcl/point_types.h>
#include <pcl/point_cloud.h>

namespace humanoid_localization{

struct Particle{
  double weight;
  tf2::Transform pose;
};

typedef std::vector<Particle> Particles;
typedef pcl::PointCloud<pcl::PointXYZ> PointCloud;

typedef std::mt19937 EngineT;
typedef std::normal_distribution<double> NormalGeneratorT;
typedef std::uniform_real_distribution<double> UniformGeneratorT;
// typedef std::normal_distribution<>::param_type NormalGeneratorT;
// typedef std::uniform_real_distribution<>::param_type UniformGeneratorT;

typedef Eigen::Matrix<float, 6, 6> Matrix6f;
typedef Eigen::Matrix<float, 6, 1> Vector6f;
typedef Eigen::Matrix<double, 6, 6> Matrix6d;
typedef Eigen::Matrix<double, 6, 1> Vector6d;

}
#endif
