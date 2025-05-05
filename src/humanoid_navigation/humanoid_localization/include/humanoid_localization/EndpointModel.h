#ifndef HUMANOID_LOCALIZATION_ENDPOINTMODEL_H_
#define HUMANOID_LOCALIZATION_ENDPOINTMODEL_H_

#include <limits>
#include <cmath>
#include <omp.h>
#include <rclcpp/rclcpp.hpp>
#include <tf2/LinearMath/Transform.hpp>
#include <humanoid_localization/ObservationModel.h>
#include <octomap/octomap.h>
#include <dynamicEDT3D/dynamicEDTOctomap.h>
#include <visualization_msgs/msg/marker.hpp>

namespace humanoid_localization {
class EndpointModel : public ObservationModel {
public:
  EndpointModel(rclcpp::Node::SharedPtr nh, std::shared_ptr<MapModel> mapModel, EngineT * rngEngine);
  virtual ~EndpointModel();
  virtual void integrateMeasurement(Particles& particles, const PointCloud& pc, const std::vector<float>& ranges, float max_range, const tf2::Transform& baseToSensor);
  virtual void setMap(std::shared_ptr<octomap::OcTree> map);

protected:
  bool getHeightError(const Particle& p, const tf2::Transform& footprintToBase, double& heightError) const;
  void initDistanceMap();
  double m_sigma;
  double m_maxObstacleDistance;
  std::shared_ptr<DynamicEDTOctomap> m_distanceMap;
};
}

#endif
