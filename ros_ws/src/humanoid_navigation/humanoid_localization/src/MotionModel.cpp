#include <humanoid_localization/MotionModel.h>
#include <humanoid_localization/tf2_utils.h>
#include <tf2/LinearMath/Quaternion.hpp>
#include <tf2/LinearMath/Transform.hpp>
#include <tf2_ros/transform_listener.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <rclcpp/rclcpp.hpp>

using namespace tf2;
using namespace std;

namespace humanoid_localization{

MotionModel::MotionModel(rclcpp::Node::SharedPtr node, EngineT* rngEngine, std::shared_ptr<tf2_ros::Buffer> tfBuffer,
                         const std::string& odomFrameId, const std::string& baseFrameId)
: m_tfBuffer(tfBuffer),
  m_rngEngine(rngEngine), // store the engine
  m_rngNormal(0.0, 1.0),
  m_rngUniform(0.0, 1.0),
  m_odomFrameId(odomFrameId), m_baseFrameId(baseFrameId),
  m_firstOdometryReceived(false)
{
  m_odomNoise2D = Eigen::Matrix3d::Zero();
  node->declare_parameter("motion_noise/xx", 0.01);
  node->declare_parameter("motion_noise/xy", 0.01);
  node->declare_parameter("motion_noise/xt", 0.0001);
  node->declare_parameter("motion_noise/yx", 0.01);
  node->declare_parameter("motion_noise/yy", 0.01);
  node->declare_parameter("motion_noise/yt", 0.0001);
  node->declare_parameter("motion_noise/tx", 0.5);
  node->declare_parameter("motion_noise/ty", 0.5);
  node->declare_parameter("motion_noise/tt", 0.01);
  node->declare_parameter("motion_noise/z", 0.01);
  node->declare_parameter("motion_noise/roll", 0.05);
  node->declare_parameter("motion_noise/pitch", 0.1);

  node->get_parameter("motion_noise/xx", m_odomNoise2D(0,0));
  node->get_parameter("motion_noise/xy", m_odomNoise2D(0,1));
  node->get_parameter("motion_noise/xt", m_odomNoise2D(0,2));
  node->get_parameter("motion_noise/yx", m_odomNoise2D(1,0));
  node->get_parameter("motion_noise/yy", m_odomNoise2D(1,1));
  node->get_parameter("motion_noise/yt", m_odomNoise2D(1,2));
  node->get_parameter("motion_noise/tx", m_odomNoise2D(2,0));
  node->get_parameter("motion_noise/ty", m_odomNoise2D(2,1));
  node->get_parameter("motion_noise/tt", m_odomNoise2D(2,2));
  node->get_parameter("motion_noise/z", m_odomNoiseZ);
  node->get_parameter("motion_noise/roll", m_odomNoiseRoll);
  node->get_parameter("motion_noise/pitch", m_odomNoisePitch);

  m_odomCalibration2D = Eigen::Matrix3d::Identity();
  node->declare_parameter("motion_calib/xx", 1.0);
  node->declare_parameter("motion_calib/xy", 0.0);
  node->declare_parameter("motion_calib/xt", 0.0);
  node->declare_parameter("motion_calib/yx", 0.0);
  node->declare_parameter("motion_calib/yy", 1.0);
  node->declare_parameter("motion_calib/yt", 0.0);
  node->declare_parameter("motion_calib/tx", 0.0);
  node->declare_parameter("motion_calib/ty", 0.0);
  node->declare_parameter("motion_calib/tt", 1.0);

  node->get_parameter("motion_calib/xx", m_odomCalibration2D(0,0));
  node->get_parameter("motion_calib/xy", m_odomCalibration2D(0,1));
  node->get_parameter("motion_calib/xt", m_odomCalibration2D(0,2));
  node->get_parameter("motion_calib/yx", m_odomCalibration2D(1,0));
  node->get_parameter("motion_calib/yy", m_odomCalibration2D(1,1));
  node->get_parameter("motion_calib/yt", m_odomCalibration2D(1,2));
  node->get_parameter("motion_calib/tx", m_odomCalibration2D(2,0));
  node->get_parameter("motion_calib/ty", m_odomCalibration2D(2,1));
  node->get_parameter("motion_calib/tt", m_odomCalibration2D(2,2));

  reset();
}

MotionModel::~MotionModel() {}

tf2::Transform MotionModel::odomTransformNoise(const tf2::Transform& odomTransform){
  Eigen::Vector3d translation(odomTransform.getOrigin().getX(), 
                              odomTransform.getOrigin().getY(),
                              0.0);
  double d = translation.norm();
  
  Eigen::Vector3d motion_variance = m_odomNoise2D * translation;
  
  double roll, pitch, yaw;
  tf2::Matrix3x3(odomTransform.getRotation()).getRPY(roll, pitch, yaw);
  
  tf2::Quaternion noiseQuat;
  noiseQuat.setRPY(
    getNormalSample() * d * m_odomNoiseRoll,
    getNormalSample() * d * m_odomNoisePitch,
    getNormalSample() * sqrt(motion_variance(2))
  );
  
  return tf2::Transform(
    noiseQuat,
    tf2::Vector3(
      getNormalSample() * sqrt(motion_variance(0)),
      getNormalSample() * sqrt(motion_variance(1)),
      getNormalSample() * d * m_odomNoiseZ
    )
  );  
}

void MotionModel::reset(){
  m_firstOdometryReceived = false;
}

void MotionModel::applyOdomTransform(tf2::Transform& particlePose, const tf2::Transform& odomTransform){
  particlePose *= calibrateOdometry(odomTransform) * odomTransformNoise(odomTransform);
}

void MotionModel::applyOdomTransform(Particles& particles, const tf2::Transform& odomTransform){
  const tf2::Transform calibratedOdomTransform = calibrateOdometry(odomTransform);

  for (unsigned i=0; i < particles.size(); ++i){
    particles[i].pose *= calibratedOdomTransform * odomTransformNoise(odomTransform);
  }
}

bool MotionModel::applyOdomTransformTemporal(Particles& particles,const rclcpp::Time& t, double dt){
  auto startTime = std::chrono::steady_clock::now();

  tf2::Transform odomTransform;
  if (!lookupOdomTransform(t, odomTransform))
    return false;

  tf2::Transform timeSampledTransform;
  rclcpp::Duration maxDuration = rclcpp::Duration::from_seconds(0.0);
  if (dt > 0.0){
    rclcpp::Time maxTime;
    std::string errorString;
    // Replace getLatestCommonTime with lookupTransform using tf2::TimePointZero
    try {
      // Get the latest transform available
      geometry_msgs::msg::TransformStamped transform = 
          m_tfBuffer->lookupTransform(m_odomFrameId, m_baseFrameId, tf2::TimePointZero);
      maxTime = rclcpp::Time(transform.header.stamp);
      maxDuration = maxTime - t;
    } catch (const tf2::TransformException& ex) {
      RCLCPP_WARN(rclcpp::get_logger("MotionModel"), "Error getting latest transform: %s", ex.what());
      return false;
    }
  }

  for (unsigned i=0; i < particles.size(); ++i){
    if (dt > 0.0){
      // rclcpp::Duration duration(m_rngUniform()*dt -dt/2.0);
      // rclcpp::Duration duration(rclcpp::Duration::from_seconds(m_rngUniform.operator()()*dt - dt/2.0));
      rclcpp::Duration duration(rclcpp::Duration::from_seconds(getUniformSample()*dt - dt/2.0));
      if (duration > maxDuration)
        duration = maxDuration;

      if (lookupOdomTransform(t + duration, timeSampledTransform))
        applyOdomTransform(particles[i].pose, timeSampledTransform);
      else{
        RCLCPP_WARN(rclcpp::get_logger("MotionModel"), "Could not lookup temporal odomTransform");
        applyOdomTransform(particles[i].pose, odomTransform);
      }
    } else{
      applyOdomTransform(particles[i].pose, odomTransform);
    }
  }

  auto endTime = std::chrono::steady_clock::now();
  std::chrono::duration<double> dwalltime = endTime - startTime;
  RCLCPP_INFO_STREAM(rclcpp::get_logger("MotionModel"), "OdomTransformTemporal took " << dwalltime.count() << "s ");

  return true;
}

tf2::Transform MotionModel::calibrateOdometry(const tf2::Transform& odomTransform) const {
  Eigen::Vector3d odomPose2D;
  double roll, pitch;
  odomPose2D(0) = odomTransform.getOrigin().getX();
  odomPose2D(1) = odomTransform.getOrigin().getY();
  odomPose2D(2) = tf2::getYaw(odomTransform.getRotation());
  tf2::Matrix3x3(odomTransform.getRotation()).getRPY(roll, pitch, odomPose2D(2));

  odomPose2D = m_odomCalibration2D * odomPose2D;

  tf2::Quaternion q;
  q.setRPY(roll, pitch, odomPose2D(2));
  
  return tf2::Transform(q, tf2::Vector3(odomPose2D(0), odomPose2D(1), odomTransform.getOrigin().getZ()));
}

bool MotionModel::lookupOdomTransform(const rclcpp::Time& t, tf2::Transform& odomTransform) const{
  // geometry_msgs::msg::PoseStamped odomPose;
  tf2::Stamped<tf2::Transform> odomPose;

  // Fix: Convert both timestamps to rclcpp::Time for comparison
  if (m_firstOdometryReceived) {
    // Create an rclcpp::Time from the message stamp
    rclcpp::Time lastStamp(m_lastOdomPose.header.stamp.sec, m_lastOdomPose.header.stamp.nanosec);
    if (t <= lastStamp) {
      RCLCPP_WARN(rclcpp::get_logger("MotionModel"), "Looking up OdomTransform that is %f ms older than the last odomPose!",
              (lastStamp - t).seconds()*1000.0);
    }
  }

  if (!lookupOdomPose(t, odomPose))
    return false;

  odomTransform = computeOdomTransform(odomPose);
  return true;
}

tf2::Transform MotionModel::computeOdomTransform(const tf2::Stamped<tf2::Transform>& currentPoseStamped) const{
  tf2::Transform currentPoseTf = currentPoseStamped;
  // tf2::fromMsg(currentPoseStamped.pose, currentPoseTf);
  
  if (m_firstOdometryReceived){
    tf2::Transform lastOdomPoseTf;
    geometry_msgs::msg::Pose lastPose;
    tf2::fromMsg(m_lastOdomPose.pose, lastOdomPoseTf);
    return lastOdomPoseTf.inverse() * currentPoseTf;
  } else{
    return tf2::Transform(tf2::Quaternion(0, 0, 0, 1), tf2::Vector3(0,0,0));
  }
}

void MotionModel::storeOdomPose(const tf2::Stamped<tf2::Transform>& odomPose){
  m_firstOdometryReceived = true;
  // Fix: Convert both timestamps to rclcpp::Time for comparison
  if (m_firstOdometryReceived) {
    // Convert timestamp from tf2::TimePoint to seconds
    double odomPose_sec = tf2::timeToSec(odomPose.stamp_);

    // Create rclcpp::Time objects from both message stamps
    rclcpp::Time newStamp = rclcpp::Time(static_cast<int64_t>(odomPose_sec * 1e9));
    rclcpp::Time lastStamp(m_lastOdomPose.header.stamp.sec, m_lastOdomPose.header.stamp.nanosec);
    
    if (newStamp <= lastStamp) {
      RCLCPP_WARN(rclcpp::get_logger("MotionModel"), "Trying to store an OdomPose that is older or equal than the current in the MotionModel, ignoring!");
      return;  // Add early return to avoid updating m_lastOdomPose
    }
  }

  // Convert tf2::Stamped<tf2::Transform> to geometry_msgs::msg::PoseStamped
  geometry_msgs::msg::PoseStamped pose;
  // pose.header.stamp = tf2_ros::toMsg(odomPose.stamp_);
  // pose.header.frame_id = odomPose.frame_id_;
  pose.header.stamp.sec = static_cast<int32_t>(tf2::timeToSec(odomPose.stamp_));
  pose.header.stamp.nanosec = static_cast<uint32_t>((tf2::timeToSec(odomPose.stamp_) - 
                              pose.header.stamp.sec) * 1e9);
  pose.header.frame_id = odomPose.frame_id_;
  
  // Convert transform to pose
  pose.pose.position.x = odomPose.getOrigin().x();
  pose.pose.position.y = odomPose.getOrigin().y();
  pose.pose.position.z = odomPose.getOrigin().z();
  pose.pose.orientation = tf2::toMsg(odomPose.getRotation());
  
  // Only gets here if the new pose has a newer timestamp
  m_lastOdomPose = pose;
}


bool MotionModel::lookupOdomPose(const rclcpp::Time& t, tf2::Stamped<tf2::Transform>& odomPose) const
{
  geometry_msgs::msg::PoseStamped pose_msg;
  geometry_msgs::msg::PoseStamped ident;
  ident.header.stamp = t;
  ident.header.frame_id = m_baseFrameId;

  try
  {
    m_tfBuffer->transform(ident, pose_msg, m_odomFrameId);
    // Convert PoseStamped to tf2::Stamped<tf2::Transform>
    tf2::fromMsg(pose_msg.pose, odomPose);
    odomPose.stamp_ = tf2::timeFromSec(t.seconds());
    odomPose.frame_id_ = m_odomFrameId;
  }
  catch(tf2::TransformException& e)
  {
    RCLCPP_WARN(rclcpp::get_logger("MotionModel"), "Failed to compute odom pose, skipping scan (%s)", e.what());
    return false;
  }

  return true;
}

bool MotionModel::lookupLocalTransform(const std::string& targetFrame, const rclcpp::Time& t,
                                       tf2::Stamped<tf2::Transform>& localTransform) const
{
  try
  {
    geometry_msgs::msg::TransformStamped transform_msg;
    transform_msg = m_tfBuffer->lookupTransform(targetFrame, m_baseFrameId, t);

    // Convert TransformStamped to tf2::Stamped<tf2::Transform>
    tf2::fromMsg(transform_msg.transform, localTransform);
    localTransform.stamp_ = tf2::timeFromSec(t.seconds());
    localTransform.frame_id_ = targetFrame;
  }
  catch(tf2::TransformException& e)
  {
    RCLCPP_WARN(rclcpp::get_logger("MotionModel"), "Failed to lookup local transform (%s)", e.what());
    return false;
  }

  return true;
}

bool MotionModel::getLastOdomPose(tf2::Stamped<tf2::Transform>& lastOdomPose) const{
  if (m_firstOdometryReceived){
    // lastOdomPose = m_lastOdomPose;
    tf2::fromMsg(m_lastOdomPose.pose, lastOdomPose);
    // set stamp and frame_id
    rclcpp::Time stamp(m_lastOdomPose.header.stamp.sec, m_lastOdomPose.header.stamp.nanosec);
    lastOdomPose.stamp_ = tf2::timeFromSec(stamp.seconds());
    lastOdomPose.frame_id_ = m_lastOdomPose.header.frame_id;
    return true;
  } else{
    return false;
  }
}

}

