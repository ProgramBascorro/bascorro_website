#include <humanoid_localization/ObservationModel.h>
#include <humanoid_localization/octomap_utils.h>
#include <humanoid_localization/transform_utils.h>
#include <rclcpp/rclcpp.hpp>

using namespace std;
using namespace tf2;
// fromMsg
namespace humanoid_localization{

ObservationModel::ObservationModel(rclcpp::Node::SharedPtr nh, std::shared_ptr<MapModel> mapModel, EngineT* rngEngine )
: m_mapModel(mapModel),
  m_rngEngine(rngEngine),  // Store the engine pointer
  m_rngNormal(0.0, 1.0),   // Initialize with parameters only
  m_rngUniform(0.0, 1.0),  // Initialize with parameters only
  m_weightRoll(1.0), m_weightPitch(1.0), m_weightZ(1.0),
  m_sigmaZ(0.02), m_sigmaRoll(0.05), m_sigmaPitch(0.05),
  m_use_squared_error(false)
{
  m_map = m_mapModel->getMap();

  nh->declare_parameter("weight_factor_roll", m_weightRoll);
  nh->declare_parameter("weight_factor_pitch", m_weightPitch);
  nh->declare_parameter("weight_factor_z", m_weightZ);
  nh->declare_parameter("motion_sigma_z", m_sigmaZ);
  nh->declare_parameter("motion_sigma_roll", m_sigmaRoll);
  nh->declare_parameter("motion_sigma_pitch", m_sigmaPitch);
  nh->declare_parameter("obs_squared_distance", m_use_squared_error);

  nh->get_parameter("weight_factor_roll", m_weightRoll);
  nh->get_parameter("weight_factor_pitch", m_weightPitch);
  nh->get_parameter("weight_factor_z", m_weightZ);
  nh->get_parameter("motion_sigma_z", m_sigmaZ);
  nh->get_parameter("motion_sigma_roll", m_sigmaRoll);
  nh->get_parameter("motion_sigma_pitch", m_sigmaPitch);
  nh->get_parameter("obs_squared_distance", m_use_squared_error);

  if (m_sigmaZ <= 0.0 || m_sigmaRoll <= 0.0 || m_sigmaPitch <= 0.0){
    RCLCPP_ERROR(nh->get_logger(), "Sigma (std.dev) needs to be > 0 in ObservationModel");
  }
}

ObservationModel::~ObservationModel() {
}

void ObservationModel::integratePoseMeasurement(Particles& particles, double poseRoll, double posePitch, const tf2::Transform& footprintToTorso){
  double poseHeight = footprintToTorso.getOrigin().getZ();
  RCLCPP_DEBUG(rclcpp::get_logger("rclcpp"), "Pose measurement z=%f R=%f P=%f", poseHeight, poseRoll, posePitch);
#pragma omp parallel for
  for (unsigned i=0; i < particles.size(); ++i){
    double roll, pitch, yaw;
    particles[i].pose.getBasis().getRPY(roll, pitch, yaw);
    particles[i].weight += m_weightRoll * logLikelihood(poseRoll - roll, m_sigmaRoll);
    particles[i].weight += m_weightPitch * logLikelihood(posePitch - pitch, m_sigmaPitch);

    double heightError;
    if (getHeightError(particles[i],footprintToTorso, heightError))
      particles[i].weight += m_weightZ * logLikelihood(heightError, m_sigmaZ);
  }
}

void ObservationModel::setMap(std::shared_ptr<octomap::OcTree> map){
  m_map = map;
}

}
