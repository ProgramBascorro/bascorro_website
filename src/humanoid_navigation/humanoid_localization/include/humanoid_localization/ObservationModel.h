#ifndef HUMANOID_LOCALIZATION_OBSERVATIONMODEL_H_
#define HUMANOID_LOCALIZATION_OBSERVATIONMODEL_H_

#include <limits>
#include <cmath>
#include <omp.h>
#include <rclcpp/rclcpp.hpp>
#include <tf2/LinearMath/Transform.hpp>
#include <tf2_ros/transform_broadcaster.h>
#include <tf2_ros/transform_listener.h>
#include <pcl_ros/transforms.hpp>
#include <humanoid_localization/humanoid_localization_defs.h>
#include <humanoid_localization/MapModel.h>
#include <octomap/octomap.h>
#include <sensor_msgs/msg/point_cloud2.hpp>

namespace humanoid_localization {

const static double SQRT_2_PI = 2.506628274;
const static double LOG_SQRT_2_PI = 0.91893853320467274178;

class ObservationModel {
public:
  ObservationModel(rclcpp::Node::SharedPtr nh, std::shared_ptr<MapModel> mapModel, EngineT* rngEngine);
  virtual ~ObservationModel();

  static inline double logLikelihood(double x, double sigma) {
    assert(!std::isnan(x));
    return -1.0 * (LOG_SQRT_2_PI) - log(sigma) - ((x * x) / (2 * sigma * sigma));
  }

  static inline double logLikelihoodSq(double x_sq, double sigma) {
    assert(!std::isnan(x_sq));
    return -1.0 * (LOG_SQRT_2_PI) - log(sigma) - ((x_sq) / (2 * sigma * sigma));
  }

  virtual void integrateMeasurement(Particles& particles, const PointCloud& pc, const std::vector<float>& ranges, float max_range, const tf2::Transform& baseToSensor) = 0;
  virtual void integratePoseMeasurement(Particles& particles, double roll, double pitch, const tf2::Transform& footprintToTorso);
  virtual void setMap(std::shared_ptr<octomap::OcTree> map);

protected:
  virtual bool getHeightError(const Particle& p, const tf2::Transform& footprintToBase, double& heightError) const = 0;
  std::shared_ptr<MapModel> m_mapModel;
  EngineT* m_rngEngine;
  NormalGeneratorT m_rngNormal;
  UniformGeneratorT m_rngUniform;
  std::shared_ptr<octomap::OcTree> m_map;
  rclcpp::Publisher<sensor_msgs::msg::PointCloud2>::SharedPtr m_pc_pub;

  double m_weightRoll;
  double m_weightPitch;
  double m_weightZ;
  double m_sigmaZ;
  double m_sigmaRoll;
  double m_sigmaPitch;
  bool m_use_squared_error;
};

}

#endif /* OBSERVATIONMODEL_H_ */
