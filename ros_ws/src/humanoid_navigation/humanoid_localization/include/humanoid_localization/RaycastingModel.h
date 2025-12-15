#ifndef HUMANOID_LOCALIZATION_RAYCASTINGMODEL_H_
#define HUMANOID_LOCALIZATION_RAYCASTINGMODEL_H_

#include <limits>
#include <cmath>
#include <omp.h>
#include <rclcpp/rclcpp.hpp>
#include <tf2/LinearMath/Transform.hpp>
#include <humanoid_localization/ObservationModel.h>
#include <octomap/octomap.h>

namespace humanoid_localization {
class RaycastingModel : public ObservationModel {
public:
  RaycastingModel(rclcpp::Node::SharedPtr nh, std::shared_ptr<MapModel> mapModel, EngineT * rngEngine);
  virtual ~RaycastingModel();
  virtual void integrateMeasurement(Particles& particles, const PointCloud& pc, const std::vector<float>& ranges, float max_range, const tf2::Transform& baseToSensor);

protected:
  bool getHeightError(const Particle& p, const tf2::Transform& footprintToBase, double& heightError) const;
  double m_zHit;
  double m_zRand;
  double m_zShort;
  double m_zMax;
  double m_sigmaHit;
  double m_lambdaShort;

  bool m_filterPointCloudGround;
  double m_groundFilterDistance;
  double m_groundFilterAngle;
  double m_groundFilterPlaneDistance;
  int m_numFloorPoints;
  int m_numNonFloorPoints;
};

}

#endif
