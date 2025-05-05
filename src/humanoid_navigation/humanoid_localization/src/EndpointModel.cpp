
#include <humanoid_localization/EndpointModel.h>
#include <humanoid_localization/octomap_utils.h>
#include <humanoid_localization/transform_utils.h>
#include <pcl/common/transforms.h>
// fromMsg
namespace humanoid_localization{

EndpointModel::EndpointModel(rclcpp::Node::SharedPtr nh, std::shared_ptr<MapModel> mapModel, EngineT * rngEngine)
: ObservationModel(nh, mapModel, rngEngine), m_sigma(0.2), m_maxObstacleDistance(0.5)
{
  RCLCPP_INFO(nh->get_logger(), "Using Endpoint observation model (precomputing...)");

  nh->get_parameter_or("endpoint/sigma", m_sigma, m_sigma);
  nh->get_parameter_or("endpoint/max_obstacle_distance", m_maxObstacleDistance, m_maxObstacleDistance);

  if (m_sigma <= 0.0){
    RCLCPP_ERROR(nh->get_logger(), "Sigma (std.dev) needs to be > 0 in EndpointModel");
  }

  initDistanceMap();
}

EndpointModel::~EndpointModel(){
}

void transformAsMatrix(const tf2::Transform& t, Eigen::Matrix4f& matrix) {
  tf2::Matrix3x3 rot = t.getBasis();
  
  // Copy rotation
  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
      matrix(i, j) = rot[i][j];
    }
  }
  
  // Copy translation
  matrix(0, 3) = t.getOrigin().x();
  matrix(1, 3) = t.getOrigin().y();
  matrix(2, 3) = t.getOrigin().z();
  
  // Fill bottom row
  matrix(3, 0) = 0.0;
  matrix(3, 1) = 0.0;
  matrix(3, 2) = 0.0;
  matrix(3, 3) = 1.0;
}

void EndpointModel::integrateMeasurement(Particles& particles, const PointCloud& pc, const std::vector<float>& ranges, float max_range, const tf2::Transform& baseToSensor){
#pragma omp parallel for
  for (unsigned i=0; i < particles.size(); ++i){
    Eigen::Matrix4f globalLaserOrigin;
    transformAsMatrix(particles[i].pose * baseToSensor, globalLaserOrigin);
    PointCloud pc_transformed;
    pcl::transformPointCloud(pc, pc_transformed, globalLaserOrigin);

    std::vector<float>::const_iterator ranges_it = ranges.begin();
    for (PointCloud::const_iterator it = pc_transformed.begin(); it != pc_transformed.end(); ++it, ++ranges_it){
      octomap::point3d endPoint(it->x, it->y, it->z);
      float dist = m_distanceMap->getDistance(endPoint);
      float sigma_scaled = m_sigma;
      if (m_use_squared_error)
         sigma_scaled = (*ranges_it) * (*ranges_it) * (m_sigma);
      if (dist > 0.0){
        particles[i].weight += logLikelihood(dist, sigma_scaled);
      } else {
        particles[i].weight += logLikelihood(m_maxObstacleDistance, sigma_scaled);
      }
    }
  }
}

bool EndpointModel::getHeightError(const Particle& p, const tf2::Transform& footprintToBase, double& heightError) const{
  tf2::Vector3 xyz = p.pose.getOrigin();
  double poseHeight = footprintToBase.getOrigin().getZ();
  std::vector<double> heights;
  m_mapModel->getHeightlist(xyz.getX(), xyz.getY(), 0.6, heights);
  if (heights.size() == 0)
    return false;

  heightError = std::numeric_limits<double>::max();
  for (unsigned i = 0; i< heights.size(); i++){
    double dist = std::abs((heights[i] + poseHeight) - xyz.getZ());
    if (dist < heightError)
      heightError = dist;
  }

  return true;
}

void EndpointModel::setMap(std::shared_ptr<octomap::OcTree> map){
  m_map = map;
  initDistanceMap();
}

void EndpointModel::initDistanceMap(){
  double x,y,z;
  m_map->getMetricMin(x,y,z);
  octomap::point3d min(x,y,z);
  m_map->getMetricMax(x,y,z);
  octomap::point3d max(x,y,z);
  m_distanceMap = std::make_shared<DynamicEDTOctomap>(float(m_maxObstacleDistance), false, &(*m_map), 0);
  m_distanceMap->update();
  RCLCPP_INFO(rclcpp::get_logger("EndpointModel"), "Distance map for endpoint model completed");
}

}

