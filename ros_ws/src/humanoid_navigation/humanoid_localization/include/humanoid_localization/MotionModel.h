#ifndef HUMANOID_LOCALIZATION_MOTIONMODEL_H_
#define HUMANOID_LOCALIZATION_MOTIONMODEL_H_

#include <rclcpp/rclcpp.hpp>
#include <tf2_ros/transform_listener.h>
#include <tf2/LinearMath/Transform.hpp>
#include <Eigen/Cholesky>
#include <humanoid_localization/humanoid_localization_defs.h>
#include <tf2/utils.hpp>
#include <tf2_ros/buffer.h>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose.hpp>
#include <geometry_msgs/msg/transform_stamped.hpp>

namespace humanoid_localization {
class MotionModel {
public:
  MotionModel(rclcpp::Node::SharedPtr nh, EngineT* rngEngine, std::shared_ptr<tf2_ros::Buffer> tfBuffer, const std::string& odomFrameId, const std::string& baseFrameId);
  virtual ~MotionModel();
  void reset();
  bool lookupOdomPose(const rclcpp::Time& t, tf2::Stamped<tf2::Transform>& odomPose) const;
  bool lookupOdomTransform(const rclcpp::Time& t, tf2::Transform& odomTransform) const;
  tf2::Transform computeOdomTransform(const tf2::Stamped<tf2::Transform>& currentPoseStamped) const;
  bool lookupLocalTransform(const std::string& targetFrame, const rclcpp::Time& t, tf2::Stamped<tf2::Transform>& localTransform) const;
  bool lookupPoseHeight(const rclcpp::Time& t, double& poseHeight) const;
  void applyOdomTransform(Particles& particles, const tf2::Transform& odomTransform);
  bool applyOdomTransformTemporal(Particles& particles, const rclcpp::Time& t, double dt);
  void storeOdomPose(const tf2::Stamped<tf2::Transform>& odomPose);
  bool getLastOdomPose(tf2::Stamped<tf2::Transform>& lastOdomPose) const;

  EIGEN_MAKE_ALIGNED_OPERATOR_NEW

protected:
  void applyOdomTransform(tf2::Transform& particlePose, const tf2::Transform& odomTransform);
  void transformPose(geometry_msgs::msg::Pose& particlePose, const tf2::Transform& odomTransform);
  tf2::Transform odomTransformNoise(const tf2::Transform& odomTransform);
  tf2::Transform calibrateOdometry(const tf2::Transform& odomTransform) const;

  // Helper methods for random number generation
  double getNormalSample() const {
    std::normal_distribution<double> dist(0.0, 1.0);
    return dist(*m_rngEngine);
  }
  
  double getUniformSample() const {
    std::uniform_real_distribution<double> dist(0.0, 1.0);
    return dist(*m_rngEngine);
  }

  std::shared_ptr<tf2_ros::Buffer> m_tfBuffer;
  EngineT* m_rngEngine;
  NormalGeneratorT m_rngNormal;
  UniformGeneratorT m_rngUniform;
  Eigen::Matrix3d m_odomNoise2D;
  Eigen::Matrix3d m_odomCalibration2D;
  double m_odomNoiseZ;
  double m_odomNoiseRoll;
  double m_odomNoisePitch;

  std::string m_odomFrameId;
  std::string m_baseFrameId;
  std::string m_footprintFrameId;

  bool m_firstOdometryReceived;
  geometry_msgs::msg::PoseStamped m_lastOdomPose;
};
}

#endif
