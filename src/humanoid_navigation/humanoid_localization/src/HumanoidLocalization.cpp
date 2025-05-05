#include <humanoid_localization/HumanoidLocalization.h>
#include <humanoid_localization/octomap_utils.h>
#include <humanoid_localization/transform_utils.h>
#include <humanoid_localization/tf2_utils.h>
#include <iostream>
#include <pcl/filters/uniform_sampling.h>
#include <pcl/filters/voxel_grid.h>
// #include <pcl/transforms.h>
#include <pcl_conversions/pcl_conversions.h>
#include <rclcpp/rclcpp.hpp>
#include <std_msgs/msg/float32.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>
#include <geometry_msgs/msg/pose_stamped.hpp>
#include <geometry_msgs/msg/pose_array.hpp>
#include <sensor_msgs/msg/point_cloud2.hpp>
#include <sensor_msgs/msg/laser_scan.hpp>
#include <sensor_msgs/msg/imu.hpp>
#include <std_srvs/srv/trigger.hpp> // ubah empty menjadi trigger
#include <tf2_ros/transform_broadcaster.h>
#include <tf2_ros/transform_listener.h>
#include <tf2/transform_datatypes.hpp>
#include <tf2/time.hpp>
#include <tf2_ros/buffer.h>
#include <tf2_ros/buffer_interface.h>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>
#include <tf2_eigen/tf2_eigen.hpp>
#include <message_filters/subscriber.hpp>
#include <message_filters/time_synchronizer.hpp>
#include <message_filters/sync_policies/approximate_time.hpp>
// fromMsg
#define _BENCH_TIME 0

namespace humanoid_localization {

using EngineT = std::mt19937;
using NormalDistributionT = std::normal_distribution<double>;
using UniformDistributionT = std::uniform_real_distribution<double>;

HumanoidLocalization::HumanoidLocalization(unsigned randomSeed)
: rclcpp::Node("humanoid_localization"),
  m_rngEngine(randomSeed),
  m_rngNormal(0.0, 1.0),
  m_rngUniform(0.0, 1.0),
  // m_rngNormal(m_rngEngine, NormalDistributionT(0.0, 1.0)),
  // m_rngUniform(m_rngEngine, UniformDistributionT(0.0, 1.0)),
  m_nh(std::make_shared<rclcpp::Node>("humanoid_localization")),
  // m_privateNh("~"),
  m_privateNh(std::make_shared<rclcpp::Node>("humanoid_localization_private")),
  m_odomFrameId("odom"), m_targetFrameId("odom"), m_baseFrameId("torso"), m_baseFootprintId("base_footprint"), m_globalFrameId("map"),
  m_useRaycasting(true), m_initFromTruepose(false), m_numParticles(500),
  m_sensorSampleDist(0.2),
  m_nEffFactor(1.0), m_minParticleWeight(0.0),
  m_bestParticleIdx(-1), m_lastIMUMsgBuffer(5),
  m_bestParticleAsMean(true),
  m_receivedSensorData(false), m_initialized(false), m_initGlobal(false), m_paused(false),
  m_syncedTruepose(false),
  m_observationThresholdTrans(0.1), m_observationThresholdRot(M_PI/6),
  m_observationThresholdHeadYawRot(0.5), m_observationThresholdHeadPitchRot(0.3),
  m_temporalSamplingRange(0.1), m_transformTolerance(0.1),
  m_groundFilterPointCloud(true), m_groundFilterDistance(0.04),
  m_groundFilterAngle(0.15), m_groundFilterPlaneDistance(0.07),
  m_sensorSampleDistGroundFactor(3),
  m_headYawRotationLastScan(0.0), m_headPitchRotationLastScan(0.0),
  m_useIMU(false),
  m_constrainMotionZ (false), m_constrainMotionRP(false), m_useTimer(false), m_timerPeriod(0.1),
  m_tfBuffer(std::make_shared<tf2_ros::Buffer>(m_nh->get_clock())),
  m_tfListener(std::make_shared<tf2_ros::TransformListener>(*m_tfBuffer)),
  m_tfBroadcaster(std::make_shared<tf2_ros::TransformBroadcaster>(m_nh))
{
  m_latest_transform.setIdentity();
  m_nh->declare_parameter("humanoid_localization.use_raycasting", rclcpp::ParameterValue(m_useRaycasting));
  m_nh->declare_parameter("humanoid_localization.odom_frame_id", rclcpp::ParameterValue(m_odomFrameId));
  m_nh->declare_parameter("humanoid_localization.target_frame_id", rclcpp::ParameterValue(m_targetFrameId));
  m_nh->declare_parameter("humanoid_localization.base_frame_id", rclcpp::ParameterValue(m_baseFrameId));
  m_nh->declare_parameter("humanoid_localization.base_footprint_id", rclcpp::ParameterValue(m_baseFootprintId));
  m_nh->declare_parameter("humanoid_localization.global_frame_id", rclcpp::ParameterValue(m_globalFrameId));
  m_nh->declare_parameter("humanoid_localization.init_from_truepose", rclcpp::ParameterValue(m_initFromTruepose));
  m_nh->declare_parameter("humanoid_localization.init_global", rclcpp::ParameterValue(m_initGlobal));
  m_nh->declare_parameter("humanoid_localization.best_particle_as_mean", rclcpp::ParameterValue(m_bestParticleAsMean));
  m_nh->declare_parameter("humanoid_localization.num_particles", rclcpp::ParameterValue(m_numParticles));
  m_nh->declare_parameter("humanoid_localization.neff_factor", rclcpp::ParameterValue(m_nEffFactor));
  m_nh->declare_parameter("humanoid_localization.min_particle_weight", rclcpp::ParameterValue(m_minParticleWeight));
  m_nh->declare_parameter("humanoid_localization.initial_pose/x", rclcpp::ParameterValue(0.0));
  m_nh->declare_parameter("humanoid_localization.initial_pose/y", rclcpp::ParameterValue(0.0));
  m_nh->declare_parameter("humanoid_localization.initial_pose/z", rclcpp::ParameterValue(0.32));
  m_nh->declare_parameter("humanoid_localization.initial_pose/roll", rclcpp::ParameterValue(0.0));
  m_nh->declare_parameter("humanoid_localization.initial_pose/pitch", rclcpp::ParameterValue(0.0));
  m_nh->declare_parameter("humanoid_localization.initial_pose/yaw", rclcpp::ParameterValue(0.0));
  m_nh->declare_parameter("humanoid_localization.initial_pose_real_zrp", rclcpp::ParameterValue(false));
  m_nh->declare_parameter("humanoid_localization.initial_std/x", rclcpp::ParameterValue(0.1));
  m_nh->declare_parameter("humanoid_localization.initial_std/y", rclcpp::ParameterValue(0.1));
  m_nh->declare_parameter("humanoid_localization.initial_std/z", rclcpp::ParameterValue(0.02));
  m_nh->declare_parameter("humanoid_localization.initial_std/roll", rclcpp::ParameterValue(0.04));
  m_nh->declare_parameter("humanoid_localization.initial_std/pitch", rclcpp::ParameterValue(0.04));
  m_nh->declare_parameter("humanoid_localization.initial_std_yaw", rclcpp::ParameterValue(M_PI/12));
  m_nh->declare_parameter("humanoid_localization.sensor_sampling_dist", rclcpp::ParameterValue(m_sensorSampleDist));
  m_nh->declare_parameter("humanoid_localization.max_range", rclcpp::ParameterValue(30.0));
  m_nh->declare_parameter("humanoid_localization.min_range", rclcpp::ParameterValue(0.05));
  m_nh->declare_parameter("humanoid_localization.update_min_trans", rclcpp::ParameterValue(m_observationThresholdTrans));
  m_nh->declare_parameter("humanoid_localization.update_min_rot", rclcpp::ParameterValue(m_observationThresholdRot));
  m_nh->declare_parameter("humanoid_localization.update_min_head_yaw", rclcpp::ParameterValue(m_observationThresholdHeadYawRot));
  m_nh->declare_parameter("humanoid_localization.update_min_head_pitch", rclcpp::ParameterValue(m_observationThresholdHeadPitchRot));
  m_nh->declare_parameter("humanoid_localization.temporal_sampling_range", rclcpp::ParameterValue(m_temporalSamplingRange));
  m_nh->declare_parameter("humanoid_localization.transform_tolerance", rclcpp::ParameterValue(m_transformTolerance));
  m_nh->declare_parameter("humanoid_localization.use_imu", rclcpp::ParameterValue(m_useIMU));
  m_nh->declare_parameter("humanoid_localization.constrain_motion_z", rclcpp::ParameterValue(m_constrainMotionZ));
  m_nh->declare_parameter("humanoid_localization.constrain_motion_rp", rclcpp::ParameterValue(m_constrainMotionRP));
  m_nh->declare_parameter("humanoid_localization.ground_filter_point_cloud", rclcpp::ParameterValue(m_groundFilterPointCloud));
  m_nh->declare_parameter("humanoid_localization.ground_filter_distance", rclcpp::ParameterValue(m_groundFilterDistance));
  m_nh->declare_parameter("humanoid_localization.ground_filter_angle", rclcpp::ParameterValue(m_groundFilterAngle));
  m_nh->declare_parameter("humanoid_localization.ground_filter_plane_distance", rclcpp::ParameterValue(m_groundFilterPlaneDistance));
  m_nh->declare_parameter("humanoid_localization.sensor_sampling_dist_ground_factor", rclcpp::ParameterValue(m_sensorSampleDistGroundFactor));
  m_nh->declare_parameter("humanoid_localization.use_timer", rclcpp::ParameterValue(m_useTimer));
  m_nh->declare_parameter("humanoid_localization.timer_period", rclcpp::ParameterValue(m_timerPeriod));

  m_motionModel = std::make_shared<MotionModel>(m_privateNh, &m_rngEngine, m_tfBuffer, m_odomFrameId, m_baseFrameId);

  if (m_useRaycasting) {
    m_mapModel = std::make_shared<OccupancyMap>(m_privateNh);
    m_observationModel = std::make_shared<RaycastingModel>(m_privateNh, m_mapModel, &m_rngEngine);
  } else {
    m_mapModel = std::make_shared<OccupancyMap>(m_privateNh);
    m_observationModel = std::make_shared<EndpointModel>(m_privateNh, m_mapModel, &m_rngEngine);
  }

  m_particles.resize(m_numParticles);
  m_poseArray.poses.resize(m_numParticles);
  m_poseArray.header.frame_id = m_globalFrameId;
  m_tfBuffer->clear();

  m_posePub = m_nh->create_publisher<geometry_msgs::msg::PoseWithCovarianceStamped>("pose", 10);
  m_poseEvalPub = m_nh->create_publisher<geometry_msgs::msg::PoseWithCovarianceStamped>("pose_eval", 10);
  m_poseOdomPub = m_privateNh->create_publisher<geometry_msgs::msg::PoseStamped>("pose_odom_sync", 10);
  m_poseArrayPub = m_privateNh->create_publisher<geometry_msgs::msg::PoseArray>("particlecloud", 10);
  m_bestPosePub = m_privateNh->create_publisher<geometry_msgs::msg::PoseArray>("best_particle", 10);
  m_nEffPub = m_privateNh->create_publisher<std_msgs::msg::Float32>("n_eff", 10);
  m_filteredPointCloudPub = m_privateNh->create_publisher<sensor_msgs::msg::PointCloud2>("filtered_cloud", 1);

  reset();

  m_globalLocSrv = m_nh->create_service<std_srvs::srv::Trigger>(
      "global_localization",
      [this](const std::shared_ptr<rmw_request_id_t> request_header,
            const std::shared_ptr<std_srvs::srv::Trigger::Request> req,
            std::shared_ptr<std_srvs::srv::Trigger::Response> res) {
          this->globalLocalizationCallback(request_header, req, res);
      });

  m_laserSub = std::make_shared<message_filters::Subscriber<sensor_msgs::msg::LaserScan>>(m_nh, "scan", 100);
  m_laserFilter = std::make_shared<tf2_ros::MessageFilter<sensor_msgs::msg::LaserScan>>(
      *m_laserSub, 
      *m_tfBuffer, 
      m_odomFrameId, 
      100,            // queue size
      m_nh,           // node for logging
      std::chrono::seconds(1)  // timeout
  );
  m_laserFilter->registerCallback(
      [this](const std::shared_ptr<const sensor_msgs::msg::LaserScan>& msg) {
          this->laserCallback(msg);
      });

  m_pointCloudSub = std::make_shared<message_filters::Subscriber<sensor_msgs::msg::PointCloud2>>(m_nh, "point_cloud", 100);
  m_pointCloudFilter = std::make_shared<tf2_ros::MessageFilter<sensor_msgs::msg::PointCloud2>>(
      *m_pointCloudSub, 
      *m_tfBuffer, 
      m_odomFrameId, 
      100,
      m_nh,
      std::chrono::seconds(1)
  );
  m_pointCloudFilter->registerCallback(std::bind(&HumanoidLocalization::pointCloudCallback, this, std::placeholders::_1));

  m_initPoseSub = std::make_shared<message_filters::Subscriber<geometry_msgs::msg::PoseWithCovarianceStamped>>(m_nh, "initialpose", 2);
  m_initPoseFilter = std::make_shared<tf2_ros::MessageFilter<geometry_msgs::msg::PoseWithCovarianceStamped>>(
      *m_initPoseSub,
      *m_tfBuffer, 
      m_globalFrameId, 
      2,
      m_nh,
      std::chrono::seconds(1)
  );
  m_initPoseFilter->registerCallback(std::bind(&HumanoidLocalization::initPoseCallback, this, std::placeholders::_1));

  m_pauseIntegrationSub = m_privateNh->create_subscription<std_msgs::msg::Bool>("pause_localization", 1, std::bind(&HumanoidLocalization::pauseLocalizationCallback, this, std::placeholders::_1));
  m_pauseLocSrv = m_privateNh->create_service<std_srvs::srv::Trigger>(
      "pause_localization_srv",
      [this](const std::shared_ptr<rmw_request_id_t> request_header,
            const std::shared_ptr<std_srvs::srv::Trigger::Request> req,
            std::shared_ptr<std_srvs::srv::Trigger::Response> res) {
          this->pauseLocalizationSrvCallback(request_header, req, res);
      });

  m_resumeLocSrv = m_privateNh->create_service<std_srvs::srv::Trigger>(
      "resume_localization_srv",
      [this](const std::shared_ptr<rmw_request_id_t> request_header,
            const std::shared_ptr<std_srvs::srv::Trigger::Request> req,
            std::shared_ptr<std_srvs::srv::Trigger::Response> res) {
          this->resumeLocalizationSrvCallback(request_header, req, res);
      });

  if (m_useIMU)
    m_imuSub = m_nh->create_subscription<sensor_msgs::msg::Imu>("imu", 5, std::bind(&HumanoidLocalization::imuCallback, this, std::placeholders::_1));
  if (m_useTimer) {
    m_timer = m_nh->create_wall_timer(std::chrono::duration<double>(m_timerPeriod), std::bind(&HumanoidLocalization::timerCallback, this));
    RCLCPP_INFO(m_nh->get_logger(), "Using timer with a period of %4f s", m_timerPeriod);
  }

  RCLCPP_INFO(m_nh->get_logger(), "NaoLocalization initialized with %d particles.", m_numParticles);
}

HumanoidLocalization::~HumanoidLocalization() {}

void HumanoidLocalization::initGlobal() {
  // Implementation for global initialization
  // This should distribute particles throughout the map
  // Example implementation:
  m_particles.resize(m_numParticles);
  
  // Get map bounds from your map model
  // double xMin, xMax, yMin, yMax, zMin, zMax;
  double xMin = -10.0, xMax = 10.0, yMin = -10.0, yMax = 10.0, zMin = 0.0, zMax = 2.0;
  
  if (m_mapModel) {
    // Use whatever method is available in your MapModel class, for example:
    // m_mapModel->getBoundingBox(xMin, xMax, yMin, yMax, zMin, zMax);
    
    // If no method exists, you can use hardcoded values as a fallback
    RCLCPP_WARN(m_nh->get_logger(), "Using default map bounds for global initialization");
  }

  double weight = 1.0/m_numParticles;
  for (unsigned i = 0; i < m_numParticles; ++i) {
    // Randomly place particles across the map
    m_particles[i].pose.setOrigin(tf2::Vector3(
      xMin + m_rngUniform(m_rngEngine) * (xMax - xMin),
      yMin + m_rngUniform(m_rngEngine) * (yMax - yMin),
      zMin + m_rngUniform(m_rngEngine) * (zMax - zMin)
    ));
    
    // Random orientation
    double roll = m_rngUniform(m_rngEngine) * 2.0 * M_PI - M_PI;
    double pitch = m_rngUniform(m_rngEngine) * 2.0 * M_PI - M_PI;
    double yaw = m_rngUniform(m_rngEngine) * 2.0 * M_PI - M_PI;
    
    tf2::Quaternion q;
    q.setRPY(roll, pitch, yaw);
    m_particles[i].pose.setRotation(q);
    
    m_particles[i].weight = weight;
  }
  
  m_initialized = true;
  m_receivedSensorData = false;
  
  RCLCPP_INFO(m_nh->get_logger(), "Global localization initialized with %d particles", m_numParticles);
}

void HumanoidLocalization::timerCallback() {
  rclcpp::Time transformExpiration = m_nh->now() + rclcpp::Duration::from_seconds(m_transformTolerance);
  geometry_msgs::msg::TransformStamped tmp_tf_stamped;
  tmp_tf_stamped.header.stamp = transformExpiration;
  tmp_tf_stamped.header.frame_id = m_globalFrameId;
  tmp_tf_stamped.child_frame_id = m_targetFrameId;
  // tmp_tf_stamped.transform = tf2::toMsg(m_latest_transform);
  tmp_tf_stamped.transform.translation.x = m_latest_transform.getOrigin().x();
  tmp_tf_stamped.transform.translation.y = m_latest_transform.getOrigin().y();
  tmp_tf_stamped.transform.translation.z = m_latest_transform.getOrigin().z();
  tmp_tf_stamped.transform.rotation = tf2::toMsg(m_latest_transform.getRotation());
  m_tfBroadcaster->sendTransform(tmp_tf_stamped);
}

void HumanoidLocalization::reset() {
  if (m_initGlobal) {
    this->initGlobal();
  } else {
    auto posePtr = std::make_shared<geometry_msgs::msg::PoseWithCovarianceStamped>();

    if (m_initFromTruepose) {
      geometry_msgs::msg::PoseStamped truePose;
      tf2::Stamped<tf2::Transform> truePoseTF;
      // tf2::Stamped<tf2::Transform> ident(tf2::Transform::getIdentity(), m_nh->now(), "torso_real");
      rclcpp::Time now = m_nh->now();
      tf2::Stamped<tf2::Transform> ident(
          tf2::Transform::getIdentity(), 
          tf2::TimePoint(std::chrono::nanoseconds(now.nanoseconds())), 
          "torso_real"
      );

      rclcpp::Time lookupTime = m_nh->now();
      while (rclcpp::ok() && !m_tfBuffer->canTransform(m_globalFrameId, ident.frame_id_, lookupTime, tf2::durationFromSec(1.0))) {
        RCLCPP_WARN(m_nh->get_logger(), "Waiting for transform %s --> %s for ground truth initialization failed, trying again...", m_globalFrameId.c_str(), ident.frame_id_.c_str());
        lookupTime = m_nh->now();
      }
      ident.stamp_ = tf2::TimePoint(std::chrono::nanoseconds(lookupTime.nanoseconds()));

      m_tfBuffer->transform(ident, truePoseTF, m_globalFrameId);
      truePose.header.stamp = tf2_ros::toMsg(truePoseTF.stamp_);
      truePose.header.frame_id = truePoseTF.frame_id_;
      truePose.pose.position.x = truePoseTF.getOrigin().x();
      truePose.pose.position.y = truePoseTF.getOrigin().y();
      truePose.pose.position.z = truePoseTF.getOrigin().z();
      truePose.pose.orientation = tf2::toMsg(truePoseTF.getRotation());

      posePtr->pose.pose.position = truePose.pose.position;
      posePtr->pose.pose.orientation = truePose.pose.orientation;
      posePtr->header = truePose.header;

      for (int j = 0; j < 6; ++j) {
        for (int i = 0; i < 6; ++i) {
          if (i == j)
            posePtr->pose.covariance[i * 6 + j] = m_initNoiseStd(i) * m_initNoiseStd(i);
          else
            posePtr->pose.covariance[i * 6 + j] = 0.0;
        }
      }
    } else {
      posePtr.reset(new geometry_msgs::msg::PoseWithCovarianceStamped());
      for (int i = 0; i < 6; ++i) {
        posePtr->pose.covariance[i * 6 + i] = m_initNoiseStd(i) * m_initNoiseStd(i);
      }

      double roll, pitch, z;
      initZRP(z, roll, pitch);

      posePtr->pose.pose.position.x = m_initPose(0);
      posePtr->pose.pose.position.y = m_initPose(1);
      posePtr->pose.pose.position.z = z;
      tf2::Quaternion quat;
      quat.setRPY(roll, pitch, m_initPose(5));
      posePtr->pose.pose.orientation = tf2::toMsg(quat);
    }

    this->initPoseCallback(posePtr);
  }
}

void HumanoidLocalization::initZRP(double& z, double& roll, double& pitch) {
  if (m_initPoseRealZRP) {
    tf2::Stamped<tf2::Transform> lastOdomPose;
    if (m_motionModel->getLastOdomPose(lastOdomPose)) {
      geometry_msgs::msg::PoseStamped odomPoseMsg;
      
      // Convert TimePoint to ROS Time
      builtin_interfaces::msg::Time rosTime;
      auto timePoint = lastOdomPose.stamp_;
      auto nanoseconds = std::chrono::duration_cast<std::chrono::nanoseconds>(
          timePoint.time_since_epoch()).count();
      rosTime.sec = static_cast<int32_t>(nanoseconds / 1000000000);
      rosTime.nanosec = static_cast<uint32_t>(nanoseconds % 1000000000);
      
      odomPoseMsg.header.stamp = rosTime;
      odomPoseMsg.header.frame_id = lastOdomPose.frame_id_;
      
      // Convert tf2::Transform to geometry_msgs::msg::Pose
      tf2::Transform transform = lastOdomPose;
      odomPoseMsg.pose.position.x = transform.getOrigin().x();
      odomPoseMsg.pose.position.y = transform.getOrigin().y();
      odomPoseMsg.pose.position.z = transform.getOrigin().z();
      odomPoseMsg.pose.orientation = tf2::toMsg(transform.getRotation());
      
      // Publish the PoseStamped message
      m_poseOdomPub->publish(odomPoseMsg);
    }

    if (!m_lastIMUMsgBuffer.empty()) {
      getRP(m_lastIMUMsgBuffer.back().orientation, roll, pitch);
    } else {
      RCLCPP_WARN(m_nh->get_logger(), "Could not determine current roll and pitch, falling back to init_pose_{roll,pitch}");
      roll = m_initPose(3);
      pitch = m_initPose(4);
    }
  } else {
    z = m_initPose(2);
    roll = m_initPose(3);
    pitch = m_initPose(4);
  }
}

void HumanoidLocalization::laserCallback(const std::shared_ptr<const sensor_msgs::msg::LaserScan>& msg) {
  RCLCPP_DEBUG(m_nh->get_logger(), "Laser received (time: %f)", msg->header.stamp.sec + msg->header.stamp.nanosec * 1e-9);

  if (!m_initialized) {
    RCLCPP_WARN(m_nh->get_logger(), "Localization not initialized yet, skipping laser callback.");
    return;
  }

  double timediff = (msg->header.stamp.sec + msg->header.stamp.nanosec * 1e-9) - (m_lastLaserTime.seconds() + m_lastLaserTime.nanoseconds() * 1e-9);
  if (m_receivedSensorData && timediff < 0) {
    RCLCPP_WARN(m_nh->get_logger(), "Ignoring received laser data that is %f s older than previous data!", timediff);
    return;
  }

  tf2::Stamped<tf2::Transform> odomPose;
  if (!m_motionModel->lookupOdomPose(msg->header.stamp, odomPose))
    return;

  bool sensor_integrated = false;
  if (!m_paused && (!m_receivedSensorData || isAboveMotionThreshold(odomPose))) {
    PointCloud pc_filtered;
    std::vector<float> laserRangesSparse;
    prepareLaserPointCloud(msg, pc_filtered, laserRangesSparse);

    sensor_integrated = localizeWithMeasurement(pc_filtered, laserRangesSparse, msg->range_max);
  }

  if (!sensor_integrated) {
    tf2::Transform odomTransform = m_motionModel->computeOdomTransform(odomPose);
    m_motionModel->applyOdomTransform(m_particles, odomTransform);
    constrainMotion(odomPose);
  } else {
    m_lastLocalizedPose = odomPose;
  }

  m_motionModel->storeOdomPose(odomPose);
  publishPoseEstimate(msg->header.stamp, sensor_integrated);
  m_lastLaserTime = msg->header.stamp;
}

void HumanoidLocalization::constrainMotion(const tf2::Transform& odomPose) {
  if (!m_constrainMotionZ && !m_constrainMotionRP)
    return;

  double z = odomPose.getOrigin().getZ();
  double odomRoll, odomPitch, uselessYaw;
  tf2::Matrix3x3(odomPose.getRotation()).getRPY(odomRoll, odomPitch, uselessYaw);

#pragma omp parallel for
  for (unsigned i = 0; i < m_particles.size(); ++i) {
    if (m_constrainMotionZ) {
      tf2::Vector3 pos = m_particles[i].pose.getOrigin();
      double floor_z = m_mapModel->getFloorHeight(m_particles[i].pose);
      pos.setZ(z + floor_z);
      m_particles[i].pose.setOrigin(pos);
    }

    if (m_constrainMotionRP) {
      double yaw = tf2::getYaw(m_particles[i].pose.getRotation());
      // m_particles[i].pose.setRotation(tf2::Quaternion(tf2::Vector3(odomRoll, odomPitch, yaw)));
      tf2::Quaternion q;
      q.setRPY(odomRoll, odomPitch, yaw);
      m_particles[i].pose.setRotation(q);
    }
  }
}

bool HumanoidLocalization::isAboveMotionThreshold(const tf2::Transform& odomPose) {
  tf2::Transform odomTransform = m_lastLocalizedPose.inverse() * odomPose;

  double yaw, pitch, roll;
  tf2::Matrix3x3(odomTransform.getRotation()).getRPY(roll, pitch, yaw);

  return (odomTransform.getOrigin().length() >= m_observationThresholdTrans || std::abs(yaw) >= m_observationThresholdRot);
}

bool HumanoidLocalization::localizeWithMeasurement(const PointCloud& pc_filtered, const std::vector<float>& ranges, double max_range) {
  rclcpp::Time t = pcl_conversions::fromPCL(pc_filtered.header).stamp;

  m_motionModel->applyOdomTransformTemporal(m_particles, t, m_temporalSamplingRange);

  tf2::Stamped<tf2::Transform> odomPose;
  if (!m_motionModel->lookupOdomPose(t, odomPose))
    return false;
  constrainMotion(odomPose);

  tf2::Stamped<tf2::Transform> localSensorFrame;
  if (!m_motionModel->lookupLocalTransform(pc_filtered.header.frame_id, t, localSensorFrame))
    return false;

  tf2::Transform torsoToSensor(localSensorFrame.inverse());

  toLogForm();

  if (!(m_constrainMotionRP && m_constrainMotionZ)) {
    bool imuMsgOk = false;
    double angleX, angleY;
    if (m_useIMU) {
      rclcpp::Time imuStamp;
      imuMsgOk = getImuMsg(t, imuStamp, angleX, angleY);
    } else {
      tf2::Stamped<tf2::Transform> lastOdomPose;
      if (m_motionModel->lookupOdomPose(t, lastOdomPose)) {
        double dropyaw;
        tf2::Matrix3x3(lastOdomPose.getRotation()).getRPY(angleX, angleY, dropyaw);
        imuMsgOk = true;
      }
    }

    tf2::Stamped<tf2::Transform> footprintToTorso;
    if (imuMsgOk) {
      if (!m_motionModel->lookupLocalTransform(m_baseFootprintId, t, footprintToTorso)) {
        RCLCPP_WARN(m_nh->get_logger(), "Could not obtain pose height in localization, skipping Pose integration");
      } else {
        m_observationModel->integratePoseMeasurement(m_particles, angleX, angleY, footprintToTorso);
      }
    } else {
      RCLCPP_WARN(m_nh->get_logger(), "Could not obtain roll and pitch measurement, skipping Pose integration");
    }
  }

  // m_filteredPointCloudPub->publish(pc_filtered);
  sensor_msgs::msg::PointCloud2 cloud_msg;
  pcl::toROSMsg(pc_filtered, cloud_msg);
  cloud_msg.header = pcl_conversions::fromPCL(pc_filtered.header);
  m_filteredPointCloudPub->publish(cloud_msg);
  m_observationModel->integrateMeasurement(m_particles, pc_filtered, ranges, max_range, torsoToSensor);

  m_mapModel->verifyPoses(m_particles);

  normalizeWeights();

  double nEffParticles = nEff();

  std_msgs::msg::Float32 nEffMsg;
  nEffMsg.data = nEffParticles;
  m_nEffPub->publish(nEffMsg);

  if (nEffParticles <= m_nEffFactor * m_particles.size()) {
    RCLCPP_INFO(m_nh->get_logger(), "Resampling, nEff=%f, numParticles=%zd", nEffParticles, m_particles.size());
    resample();
  } else {
    RCLCPP_INFO(m_nh->get_logger(), "Skipped resampling, nEff=%f, numParticles=%zd", nEffParticles, m_particles.size());
  }

  m_receivedSensorData = true;

  return true;
}

void HumanoidLocalization::prepareLaserPointCloud(const std::shared_ptr<const sensor_msgs::msg::LaserScan>& laser, PointCloud& pc, std::vector<float>& ranges) const {
  unsigned numBeams = laser->ranges.size();
  unsigned step = 1;

  unsigned int numBeamsSkipped = 0;

  double laserMin = std::max(double(laser->range_min), m_filterMinRange);

  ranges.reserve(50);

  pcl_conversions::toPCL(laser->header, pc.header);
  pc.points.reserve(50);
  for (unsigned beam_idx = 0; beam_idx < numBeams; beam_idx += step) {
    float range = laser->ranges[beam_idx];
    if (range >= laserMin && range <= m_filterMaxRange) {
      double laserAngle = laser->angle_min + beam_idx * laser->angle_increment;
      tf2::Transform laserAngleRotation(tf2::Quaternion(tf2::Vector3(0.0, 0.0, 1.0), laserAngle));
      tf2::Vector3 laserEndpointTrans(range, 0.0, 0.0);
      tf2::Vector3 pt(laserAngleRotation * laserEndpointTrans);

      pc.points.push_back(pcl::PointXYZ(pt.x(), pt.y(), pt.z()));
      ranges.push_back(range);
    } else {
      numBeamsSkipped++;
    }
  }
  pc.height = 1;
  pc.width = pc.points.size();
  pc.is_dense = true;

  pcl::UniformSampling<pcl::PointXYZ> uniformSampling;
  pcl::PointCloud<pcl::PointXYZ>::Ptr cloudPtr;
  cloudPtr.reset(new pcl::PointCloud<pcl::PointXYZ>(pc));
  uniformSampling.setInputCloud(cloudPtr);
  uniformSampling.setRadiusSearch(m_sensorSampleDist);
  pcl::PointCloud<int> sampledIndices;
  pcl::copyPointCloud(*cloudPtr, sampledIndices.points, pc);

  std::vector<float> rangesSparse;
  rangesSparse.resize(sampledIndices.size());
  for (size_t i = 0; i < rangesSparse.size(); ++i) {
    rangesSparse[i] = ranges[sampledIndices.points[i]];
  }
  ranges = rangesSparse;
  RCLCPP_INFO(m_nh->get_logger(), "Laser PointCloud subsampled: %zu from %zu (%u out of valid range)", pc.size(), cloudPtr->size(), numBeamsSkipped);
}

int HumanoidLocalization::filterUniform(const PointCloud& cloud_in, PointCloud& cloud_out, int numSamples) const {
  int numPoints = static_cast<int>(cloud_in.size());
  numSamples = std::min(numSamples, numPoints);
  std::vector<unsigned int> indices;
  indices.reserve(numPoints);
  for (int i = 0; i < numPoints; ++i)
    indices.push_back(i);
  std::random_shuffle(indices.begin(), indices.end());

  cloud_out.reserve(cloud_out.size() + numSamples);
  for (int i = 0; i < numSamples; ++i) {
    cloud_out.push_back(cloud_in.at(indices[i]));
  }
  return numSamples;
}

void HumanoidLocalization::filterGroundPlane(const PointCloud& pc, PointCloud& ground, PointCloud& nonground, double groundFilterDistance, double groundFilterAngle, double groundFilterPlaneDistance) const {
  ground.header = pc.header;
  nonground.header = pc.header;

  if (pc.size() < 50) {
    RCLCPP_WARN(m_nh->get_logger(), "Pointcloud in HumanoidLocalization::filterGroundPlane too small, skipping ground plane extraction");
    nonground = pc;
  } else {
    pcl::ModelCoefficients::Ptr coefficients(new pcl::ModelCoefficients);
    pcl::PointIndices::Ptr inliers(new pcl::PointIndices);

    pcl::SACSegmentation<pcl::PointXYZ> seg;
    seg.setOptimizeCoefficients(true);
    seg.setModelType(pcl::SACMODEL_PERPENDICULAR_PLANE);
    seg.setMethodType(pcl::SAC_RANSAC);
    seg.setMaxIterations(200);
    seg.setDistanceThreshold(groundFilterDistance);
    seg.setAxis(Eigen::Vector3f(0, 0, 1));
    seg.setEpsAngle(groundFilterAngle);

    PointCloud cloud_filtered(pc);
    pcl::ExtractIndices<pcl::PointXYZ> extract;
    bool groundPlaneFound = false;

    while (cloud_filtered.size() > 10 && !groundPlaneFound) {
      seg.setInputCloud(cloud_filtered.makeShared());
      seg.segment(*inliers, *coefficients);
      if (inliers->indices.size() == 0) {
        RCLCPP_INFO(m_nh->get_logger(), "PCL segmentation did not find any plane.");
        break;
      }

      extract.setInputCloud(cloud_filtered.makeShared());
      extract.setIndices(inliers);

      if (std::abs(coefficients->values.at(3)) < groundFilterPlaneDistance) {
        RCLCPP_DEBUG(m_nh->get_logger(), "Ground plane found: %zu/%zu inliers. Coeff: %f %f %f %f", inliers->indices.size(), cloud_filtered.size(),
                     coefficients->values.at(0), coefficients->values.at(1), coefficients->values.at(2), coefficients->values.at(3));
        extract.setNegative(false);
        extract.filter(ground);

        if (inliers->indices.size() != cloud_filtered.size()) {
          extract.setNegative(true);
          PointCloud cloud_out;
          extract.filter(cloud_out);
          nonground += cloud_out;
          cloud_filtered = cloud_out;
        }

        groundPlaneFound = true;
      } else {
        RCLCPP_DEBUG(m_nh->get_logger(), "Horizontal plane (not ground) found: %zu/%zu inliers. Coeff: %f %f %f %f", inliers->indices.size(), cloud_filtered.size(),
                     coefficients->values.at(0), coefficients->values.at(1), coefficients->values.at(2), coefficients->values.at(3));
        pcl::PointCloud<pcl::PointXYZ> cloud_out;
        extract.setNegative(false);
        extract.filter(cloud_out);
        nonground += cloud_out;

        if (inliers->indices.size() != cloud_filtered.size()) {
          extract.setNegative(true);
          cloud_out.points.clear();
          extract.filter(cloud_out);
          cloud_filtered = cloud_out;
        } else {
          cloud_filtered.points.clear();
        }
      }
    }

    if (!groundPlaneFound) {
      RCLCPP_WARN(m_nh->get_logger(), "No ground plane found in scan");

      pcl::PassThrough<pcl::PointXYZ> second_pass;
      second_pass.setFilterFieldName("z");
      second_pass.setFilterLimits(-groundFilterPlaneDistance, groundFilterPlaneDistance);
      second_pass.setInputCloud(pc.makeShared());
      second_pass.filter(ground);

      second_pass.setNegative(true);
      second_pass.filter(nonground);
    }
  }
}

void HumanoidLocalization::pointCloudCallback(const std::shared_ptr<const sensor_msgs::msg::PointCloud2>& msg) {
  RCLCPP_DEBUG(m_nh->get_logger(), "PointCloud received (time: %f)", 
             msg->header.stamp.sec + msg->header.stamp.nanosec * 1e-9);

  if (!m_initialized){
    RCLCPP_WARN(m_nh->get_logger(), "Localization not initialized yet, skipping PointCloud callback.");
    return;
  }

  double timediff = (msg->header.stamp.sec + msg->header.stamp.nanosec * 1e-9) - 
                   (m_lastPointCloudTime.seconds() + m_lastPointCloudTime.nanoseconds() * 1e-9);
  if (m_receivedSensorData && timediff < 0){
    RCLCPP_WARN(m_nh->get_logger(), "Ignoring received PointCloud data that is %f s older than previous data!", timediff);
    return;
  }

  // absolute, current odom pose
  tf2::Stamped<tf2::Transform> odomPose;
  // check if odometry available, skip scan if not.
  if (!m_motionModel->lookupOdomPose(msg->header.stamp, odomPose))
    return;

  bool sensor_integrated = false;

  // TODO #1: Make this nicer: head rotations for integration check
  // TODO #2: Initialization of m_headYawRotationLastScan, etc needs to be set correctly
  bool isAboveHeadMotionThreshold = false;
  double headYaw, headPitch, headRoll;
  tf2::Stamped<tf2::Transform> torsoToSensor;
  if (!m_motionModel->lookupLocalTransform(msg->header.frame_id, msg->header.stamp, torsoToSensor))
      return; //TODO: should we apply applyOdomTransformTemporal, before returning

  // TODO #3: Invert transform?: tf2::Transform torsoToSensor(localSensorFrame.inverse());

  tf2::Matrix3x3(torsoToSensor.getRotation()).getRPY(headRoll, headPitch, headYaw);
  double headYawRotationSinceScan = std::abs(headYaw - m_headYawRotationLastScan);
  double headPitchRotationSinceScan = std::abs(headPitch - m_headPitchRotationLastScan);

  if (headYawRotationSinceScan>= m_observationThresholdHeadYawRot || headPitchRotationSinceScan >= m_observationThresholdHeadPitchRot)
      isAboveHeadMotionThreshold = true;
  // end #1

  if (!m_paused && (!m_receivedSensorData || isAboveHeadMotionThreshold || isAboveMotionThreshold(odomPose))) {
    // convert laser to point cloud first:
    PointCloud pc_filtered;
    std::vector<float> rangesSparse;
    prepareGeneralPointCloud(msg, pc_filtered, rangesSparse);

    double maxRange = 10.0; // TODO #4: What is a maxRange for pointClouds?
    RCLCPP_DEBUG(m_nh->get_logger(), "Updating Pose Estimate from a PointCloud with %zu points and %zu ranges", pc_filtered.size(), rangesSparse.size());
    sensor_integrated = localizeWithMeasurement(pc_filtered, rangesSparse, maxRange);
  } 
  
  if(!sensor_integrated){ // no observation necessary: propagate particles forward by full interval
     // relative odom transform to last odomPose
     tf2::Transform odomTransform = m_motionModel->computeOdomTransform(odomPose);
     m_motionModel->applyOdomTransform(m_particles, odomTransform);
     constrainMotion(odomPose);
  }
  else{
     m_lastLocalizedPose = odomPose;
     // TODO #1
     m_headYawRotationLastScan = headYaw;
     m_headPitchRotationLastScan = headPitch;
  }

  m_motionModel->storeOdomPose(odomPose);
  publishPoseEstimate(msg->header.stamp, sensor_integrated);
  m_lastPointCloudTime = msg->header.stamp;
  RCLCPP_DEBUG(m_nh->get_logger(), "PointCloud callback complete.");
}

// Add this implementation after filterGroundPlane method
void HumanoidLocalization::prepareGeneralPointCloud(const std::shared_ptr<const sensor_msgs::msg::PointCloud2>& msg, PointCloud& pc, std::vector<float>& ranges) const {
  
  // Convert ROS PointCloud2 to PCL format
  pcl::PCLPointCloud2 pcl_pc2;
  pcl_conversions::toPCL(*msg, pcl_pc2);
  PointCloud cloud;
  pcl::fromPCLPointCloud2(pcl_pc2, cloud);
  
  // Set the header to match the incoming message
  pcl_conversions::toPCL(msg->header, cloud.header);
  
  // Filter out points outside the range bounds
  PointCloud filtered_cloud;
  ranges.clear();
  
  for (const auto& point : cloud.points) {
    // Calculate range (distance from origin)
    float range = std::sqrt(point.x*point.x + point.y*point.y + point.z*point.z);
    
    if (range >= m_filterMinRange && range <= m_filterMaxRange) {
      filtered_cloud.push_back(point);
      ranges.push_back(range);
    }
  }
  
  filtered_cloud.header = cloud.header;
  filtered_cloud.height = 1;
  filtered_cloud.width = filtered_cloud.points.size();
  filtered_cloud.is_dense = false;
  
  // Ground plane filtering if enabled
  if (m_groundFilterPointCloud) {
    PointCloud ground, nonground;
    filterGroundPlane(filtered_cloud, ground, nonground, 
                     m_groundFilterDistance, m_groundFilterAngle, 
                     m_groundFilterPlaneDistance);
    
    // Only keep non-ground points for localization
    pc = nonground;
    
    // Update ranges to match the filtered pointcloud
    ranges.clear();
    for (const auto& point : nonground.points) {
      float range = std::sqrt(point.x*point.x + point.y*point.y + point.z*point.z);
      ranges.push_back(range);
    }
  } else {
    pc = filtered_cloud;
  }
  
  // Downsample the point cloud if it's too dense
  if (pc.points.size() > 1000) {
      pcl::VoxelGrid<pcl::PointXYZ> voxel_grid;
  pcl::PointCloud<pcl::PointXYZ>::Ptr cloudPtr(new pcl::PointCloud<pcl::PointXYZ>(pc));
  voxel_grid.setInputCloud(cloudPtr);
  voxel_grid.setLeafSize(m_sensorSampleDist, m_sensorSampleDist, m_sensorSampleDist);
  pcl::PointCloud<pcl::PointXYZ> filtered_cloud;
  voxel_grid.filter(filtered_cloud);

  // Directly use the filtered cloud
  pc = filtered_cloud;

  // Recalculate ranges for the new cloud
  ranges.clear();
  for (const auto& point : pc.points) {
    float range = std::sqrt(point.x*point.x + point.y*point.y + point.z*point.z);
    ranges.push_back(range);
  }

  }
  
  RCLCPP_INFO(m_nh->get_logger(), "Point Cloud prepared: %zu points with ranges", pc.size());
}

void HumanoidLocalization::imuCallback(const std::shared_ptr<const sensor_msgs::msg::Imu>& msg){
  m_lastIMUMsgBuffer.push_back(*msg);
}

bool HumanoidLocalization::getImuMsg(const rclcpp::Time& stamp, rclcpp::Time& imuStamp, double& angleX, double& angleY) const {
  if(m_lastIMUMsgBuffer.empty())
    return false;

  typedef boost::circular_buffer<sensor_msgs::msg::Imu>::const_iterator ItT;
  const double maxAge = 0.2;
  double closestOlderStamp = std::numeric_limits<double>::max();
  double closestNewerStamp = std::numeric_limits<double>::max();
  ItT closestOlder = m_lastIMUMsgBuffer.end(), closestNewer = m_lastIMUMsgBuffer.end();
  
  double stamp_sec = stamp.seconds();
  
  for(ItT it = m_lastIMUMsgBuffer.begin(); it != m_lastIMUMsgBuffer.end(); it++) {
    double it_sec = it->header.stamp.sec + it->header.stamp.nanosec * 1e-9;
    const double age = stamp_sec - it_sec;
    if(age >= 0.0 && age < closestOlderStamp) {
      closestOlderStamp = age;
      closestOlder = it;
    } else if(age < 0.0 && -age < closestNewerStamp) {
      closestNewerStamp = -age;
      closestNewer = it;
    }
  }

  if(closestOlderStamp < maxAge && closestNewerStamp < maxAge && closestOlderStamp + closestNewerStamp > 0.0) {
    // Linear interpolation
    const double weightOlder = closestNewerStamp / (closestNewerStamp + closestOlderStamp);
    const double weightNewer = 1.0 - weightOlder;
    
    double older_sec = closestOlder->header.stamp.sec + closestOlder->header.stamp.nanosec * 1e-9;
    double newer_sec = closestNewer->header.stamp.sec + closestNewer->header.stamp.nanosec * 1e-9;
    double interp_sec = weightOlder * older_sec + weightNewer * newer_sec;
    
    imuStamp = rclcpp::Time(static_cast<int64_t>(interp_sec * 1e9));
    
    double olderX, olderY, newerX, newerY;
    getRP(closestOlder->orientation, olderX, olderY);
    getRP(closestNewer->orientation, newerX, newerY);
    angleX = weightOlder * olderX + weightNewer * newerX;
    angleY = weightOlder * olderY + weightNewer * newerY;
    
    RCLCPP_DEBUG(m_nh->get_logger(), "Msg: %.3f, Interpolate [%.3f .. %.3f .. %.3f]", 
                stamp_sec, older_sec, interp_sec, newer_sec);
    return true;
  } else if(closestOlderStamp < maxAge || closestNewerStamp < maxAge) {
    // Return closer one
    ItT it = (closestOlderStamp < closestNewerStamp) ? closestOlder : closestNewer;
    imuStamp = rclcpp::Time(it->header.stamp.sec, it->header.stamp.nanosec);
    getRP(it->orientation, angleX, angleY);
    return true;
  } else {
    if(closestOlderStamp < closestNewerStamp)
      RCLCPP_WARN(m_nh->get_logger(), "Closest IMU message is %.2f seconds too old, skipping pose integration", closestOlderStamp);
    else
      RCLCPP_WARN(m_nh->get_logger(), "Closest IMU message is %.2f seconds too new, skipping pose integration", closestNewerStamp);
    return false;
  }
}

void HumanoidLocalization::initPoseCallback(const std::shared_ptr<const geometry_msgs::msg::PoseWithCovarianceStamped>& msg) {
  tf2::Transform pose;
  // tf2::fromMsg(msg->pose.pose, pose);

  if (msg->header.frame_id != m_globalFrameId) {
    RCLCPP_WARN(m_nh->get_logger(), "Frame ID of \"initialpose\" (%s) is different from the global frame %s", msg->header.frame_id.c_str(), m_globalFrameId.c_str());
  }

  std::vector<double> heights;
  double poseHeight = 0.0;
  if (std::abs(pose.getOrigin().getZ()) < 0.01) {
    m_mapModel->getHeightlist(pose.getOrigin().getX(), pose.getOrigin().getY(), 0.6, heights);
    if (heights.size() == 0) {
      RCLCPP_WARN(m_nh->get_logger(), "No ground level to stand on found at map position, assuming 0");
      heights.push_back(0.0);
    }

    bool poseHeightOk = false;
    if (m_initPoseRealZRP) {
      rclcpp::Time stamp(msg->header.stamp);
      if (stamp == rclcpp::Time(0)) {
        tf2::Stamped<tf2::Transform> lastOdomPose;
        m_motionModel->getLastOdomPose(lastOdomPose);
        // stamp = lastOdomPose.stamp_;
        auto nanoseconds = std::chrono::duration_cast<std::chrono::nanoseconds>(
            lastOdomPose.stamp_.time_since_epoch()).count();
        stamp = rclcpp::Time(nanoseconds);
      }
      poseHeightOk = lookupPoseHeight(stamp, poseHeight);
      if (!poseHeightOk) {
        RCLCPP_WARN(m_nh->get_logger(), "Could not determine current pose height, falling back to init_pose_z");
      }
    }
    if (!poseHeightOk) {
      RCLCPP_INFO(m_nh->get_logger(), "Use pose height from init_pose_z");
      poseHeight = m_initPose(2);
    }
  }

  Matrix6d initCov;
  if ((std::abs(msg->pose.covariance[6 * 0 + 0] - 0.25) < 0.1) && (std::abs(msg->pose.covariance[6 * 1 + 1] - 0.25) < 0.1) && (std::abs(msg->pose.covariance[6 * 3 + 3] - M_PI / 12.0 * M_PI / 12.0) < 0.1)) {
    RCLCPP_INFO(m_nh->get_logger(), "Covariance originates from RViz, using default parameters instead");
    initCov = Matrix6d::Zero();
    initCov.diagonal() = m_initNoiseStd.cwiseProduct(m_initNoiseStd);

    bool ok = false;
    const double yaw = tf2::getYaw(pose.getRotation());
    if (m_initPoseRealZRP) {
      bool useOdometry = true;
      if (m_useIMU) {
        if (m_lastIMUMsgBuffer.empty()) {
          RCLCPP_WARN(m_nh->get_logger(), "Could not determine current roll and pitch because IMU message buffer is empty.");
        } else {
          double roll, pitch;
          if (msg->header.stamp == rclcpp::Time(0)) {
            getRP(m_lastIMUMsgBuffer.back().orientation, roll, pitch);
            ok = true;
          } else {
            rclcpp::Time imuStamp;
            ok = getImuMsg(msg->header.stamp, imuStamp, roll, pitch);
          }
          if (ok) {
            RCLCPP_INFO(m_nh->get_logger(), "roll and pitch not set in initPoseCallback, use IMU values (roll = %f, pitch = %f) instead", roll, pitch);
            // pose.setRotation(tf2::Quaternion(tf2::Vector3(roll, pitch, yaw)));
            tf2::Quaternion q;
            q.setRPY(roll, pitch, yaw);
            pose.setRotation(q);
            useOdometry = false;
          } else {
            RCLCPP_WARN(m_nh->get_logger(), "Could not determine current roll and pitch from IMU, falling back to odometry roll and pitch");
            useOdometry = true;
          }
        }
      }

      if (useOdometry) {
        double roll, pitch, dropyaw;
        tf2::Stamped<tf2::Transform> lastOdomPose;
        ok = m_motionModel->getLastOdomPose(lastOdomPose);
        if (ok) {
          tf2::Matrix3x3(lastOdomPose.getRotation()).getRPY(roll, pitch, dropyaw);
          // pose.setRotation(tf2::Quaternion(tf2::Vector3(roll, pitch, yaw)));
          tf2::Quaternion q;
          q.setRPY(roll, pitch, yaw);
          pose.setRotation(q);
          RCLCPP_INFO(m_nh->get_logger(), "roll and pitch not set in initPoseCallback, use odometry values (roll = %f, pitch = %f) instead", roll, pitch);
        } else {
          RCLCPP_WARN(m_nh->get_logger(), "Could not determine current roll and pitch from odometry, falling back to init_pose_{roll,pitch} parameters");
        }
      }
    }

    if (!ok) {
      RCLCPP_INFO(m_nh->get_logger(), "roll and pitch not set in initPoseCallback, use init_pose_{roll,pitch} parameters instead");
      // pose.setRotation(tf2::Quaternion(tf2::Vector3(m_initPose(3), m_initPose(4), yaw)));
      tf2::Quaternion q;
      q.setRPY(m_initPose(3), m_initPose(4), yaw);
      pose.setRotation(q);
    }
  } else {
    for (int j = 0; j < initCov.cols(); ++j) {
      for (int i = 0; i < initCov.rows(); ++i) {
        initCov(i, j) = msg->pose.covariance[i * initCov.cols() + j];
      }
    }
  }

  Matrix6d initCovL = initCov.llt().matrixL();
  tf2::Transform transformNoise;
  unsigned idx = 0;
  for (auto& particle : m_particles) {
    Vector6d poseNoise;
    for (unsigned i = 0; i < 6; ++i) {
      poseNoise(i) = m_rngNormal(m_rngEngine);
    }
    Vector6d poseCovNoise = initCovL * poseNoise;
    for (unsigned i = 0; i < 6; ++i) {
      if (std::abs(initCov(i, i)) < 0.00001)
        poseCovNoise(i) = 0.0;
    }

    transformNoise.setOrigin(tf2::Vector3(poseCovNoise(0), poseCovNoise(1), poseCovNoise(2)));
    tf2::Quaternion q;
    q.setRPY(poseCovNoise(3), poseCovNoise(4), poseCovNoise(5));

    transformNoise.setRotation(q);
    particle.pose = pose;

    if (heights.size() > 0) {
      particle.pose.getOrigin().setZ(heights.at(int(double(idx) / m_particles.size() * heights.size())) + poseHeight);
    }

    particle.pose *= transformNoise;
    particle.weight = 1.0 / m_particles.size();
    idx++;
  }

  RCLCPP_INFO(m_nh->get_logger(), "Pose reset around mean (%f %f %f)", pose.getOrigin().getX(), pose.getOrigin().getY(), pose.getOrigin().getZ());

  m_motionModel->reset();
  m_receivedSensorData = false;
  m_initialized = true;

  rclcpp::Time stampPublish = msg->header.stamp;
  if (stampPublish == rclcpp::Time(0)) {
    tf2::Stamped<tf2::Transform> lastOdomPose;
    m_motionModel->getLastOdomPose(lastOdomPose);
    // stampPublish = lastOdomPose.stamp_;
    auto nanoseconds = std::chrono::duration_cast<std::chrono::nanoseconds>(
        lastOdomPose.stamp_.time_since_epoch()).count();
    stampPublish = rclcpp::Time(nanoseconds);
    if (stampPublish == rclcpp::Time(0))
      stampPublish = m_nh->now();
  }

  publishPoseEstimate(stampPublish, false);
}

void HumanoidLocalization::globalLocalizationCallback(const std::shared_ptr<rmw_request_id_t>& request_header,
                                                      const std::shared_ptr<std_srvs::srv::Trigger::Request>& req,
                                                      std::shared_ptr<std_srvs::srv::Trigger::Response>& res) {
  initGlobal();
  res->success = true;
  res->message = "Global localization initialized";
  // return true;
}

void HumanoidLocalization::normalizeWeights() {
  double wmin = std::numeric_limits<double>::max();
  double wmax = -std::numeric_limits<double>::max();

  for (auto& particle : m_particles) {
    double weight = particle.weight;
    assert(!std::isnan(weight));
    if (weight < wmin)
      wmin = weight;
    if (weight > wmax) {
      wmax = weight;
      m_bestParticleIdx = &particle - &m_particles[0];
    }
  }
  if (wmin > wmax) {
    RCLCPP_ERROR(m_nh->get_logger(), "Error in weights: min=%f, max=%f, 1st particle weight=%f", wmin, wmax, m_particles[1].weight);
  }

  double min_normalized_value;
  if (m_minParticleWeight > 0.0)
    min_normalized_value = std::max(log(m_minParticleWeight), wmin - wmax);
  else
    min_normalized_value = wmin - wmax;

  double max_normalized_value = 0.0;
  double dn = max_normalized_value - min_normalized_value;
  double dw = wmax - wmin;
  if (dw == 0.0) dw = 1;
  double scale = dn / dw;
  if (scale < 0.0) {
    RCLCPP_WARN(m_nh->get_logger(), "normalizeWeights: scale is %f < 0, dw=%f, dn=%f", scale, dw, dn);
  }
  double offset = -wmax * scale;
  double weights_sum = 0.0;

#pragma omp parallel
  {
#pragma omp for
    for (unsigned i = 0; i < m_particles.size(); ++i) {
      double w = m_particles[i].weight;
      w = exp(scale * w + offset);
      assert(!std::isnan(w));
      m_particles[i].weight = w;
#pragma omp atomic
      weights_sum += w;
    }

    assert(weights_sum > 0.0);
#pragma omp for
    for (unsigned i = 0; i < m_particles.size(); ++i) {
      m_particles[i].weight /= weights_sum;
    }
  }
}

double HumanoidLocalization::getCumParticleWeight() const {
  double cumWeight = 0.0;
  for (const auto& particle : m_particles) {
    cumWeight += particle.weight;
  }
  return cumWeight;
}

void HumanoidLocalization::resample(unsigned numParticles) {
  if (numParticles <= 0)
    numParticles = m_numParticles;

  double interval = getCumParticleWeight() / numParticles;
  double target = interval * m_rngUniform(m_rngEngine);

  double cumWeight = 0;
  std::vector<unsigned> indices(numParticles);

  unsigned n = 0;
  for (unsigned i = 0; i < m_particles.size(); ++i) {
    cumWeight += m_particles[i].weight;
    while (cumWeight > target && n < numParticles) {
      if (m_bestParticleIdx >= 0 && i == unsigned(m_bestParticleIdx)) {
        m_bestParticleIdx = n;
      }
      indices[n++] = i;
      target += interval;
    }
  }

  Particles oldParticles = m_particles;
  m_particles.resize(numParticles);
  m_poseArray.poses.resize(numParticles);
  double newWeight = 1.0 / numParticles;
#pragma omp parallel for
  for (unsigned i = 0; i < numParticles; ++i) {
    m_particles[i].pose = oldParticles[indices[i]].pose;
    m_particles[i].weight = newWeight;
  }
}

void HumanoidLocalization::publishPoseEstimate(const rclcpp::Time& time, bool publish_eval) {
  m_poseArray.header.stamp = time;

  if (m_poseArray.poses.size() != m_particles.size())
    m_poseArray.poses.resize(m_particles.size());

#pragma omp parallel for
  for (unsigned i = 0; i < m_particles.size(); ++i) {
    // m_poseArray.poses[i] = tf2::toMsg(m_particles[i].pose);
    geometry_msgs::msg::Pose& pose_msg = m_poseArray.poses[i];
    pose_msg.position.x = m_particles[i].pose.getOrigin().x();
    pose_msg.position.y = m_particles[i].pose.getOrigin().y();
    pose_msg.position.z = m_particles[i].pose.getOrigin().z();
    pose_msg.orientation = tf2::toMsg(m_particles[i].pose.getRotation());
  }

  m_poseArrayPub->publish(m_poseArray);

  geometry_msgs::msg::PoseWithCovarianceStamped p;
  p.header.stamp = time;
  p.header.frame_id = m_globalFrameId;

  tf2::Transform bestParticlePose;
  if (m_bestParticleAsMean)
    bestParticlePose = getMeanParticlePose();
  else
    bestParticlePose = getBestParticlePose();

  // p.pose.pose = tf2::toMsg(bestParticlePose);
  p.pose.pose.position.x = bestParticlePose.getOrigin().x();
  p.pose.pose.position.y = bestParticlePose.getOrigin().y();
  p.pose.pose.position.z = bestParticlePose.getOrigin().z();
  p.pose.pose.orientation = tf2::toMsg(bestParticlePose.getRotation());
  m_posePub->publish(p);

  if (publish_eval) {
    m_poseEvalPub->publish(p);
  }

  geometry_msgs::msg::PoseArray bestPose;
  bestPose.header = p.header;
  bestPose.poses.resize(1);
  geometry_msgs::msg::Pose pose;
  pose.position.x = bestParticlePose.getOrigin().x();
  pose.position.y = bestParticlePose.getOrigin().y();
  pose.position.z = bestParticlePose.getOrigin().z();
  pose.orientation = tf2::toMsg(bestParticlePose.getRotation());
  bestPose.poses[0] = pose;
  m_bestPosePub->publish(bestPose);

  tf2::Stamped<tf2::Transform> lastOdomPose;
  if (m_motionModel->getLastOdomPose(lastOdomPose)) {
    geometry_msgs::msg::PoseStamped odomPoseMsg;
    // odomPoseMsg.header.stamp = lastOdomPose.stamp_;
    auto stamp_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
        lastOdomPose.stamp_.time_since_epoch()).count();
    builtin_interfaces::msg::Time rosTime;
    rosTime.sec = static_cast<int32_t>(stamp_ns / 1000000000);
    rosTime.nanosec = static_cast<uint32_t>(stamp_ns % 1000000000);
    odomPoseMsg.header.stamp = rosTime;
    odomPoseMsg.header.frame_id = lastOdomPose.frame_id_;
    
    // Convert tf2::Transform to geometry_msgs::msg::Pose
    tf2::Transform transform = lastOdomPose;
    odomPoseMsg.pose.position.x = transform.getOrigin().x();
    odomPoseMsg.pose.position.y = transform.getOrigin().y();
    odomPoseMsg.pose.position.z = transform.getOrigin().z();
    odomPoseMsg.pose.orientation = tf2::toMsg(transform.getRotation());
    
    // Publish the entire PoseStamped message
    m_poseOdomPub->publish(odomPoseMsg);
  }

  tf2::Stamped<tf2::Transform> targetToMapTF;
  try {
    tf2::Stamped<tf2::Transform> baseToMapTF;
    baseToMapTF.setData(bestParticlePose.inverse());
    baseToMapTF.stamp_ = tf2::TimePoint(std::chrono::nanoseconds(time.nanoseconds()));;
    baseToMapTF.frame_id_ = m_baseFrameId;
    m_tfBuffer->transform(baseToMapTF, targetToMapTF, m_targetFrameId);
  } catch (const tf2::TransformException& e) {
    RCLCPP_WARN(m_nh->get_logger(), "Failed to subtract base to %s transform, will not publish pose estimate: %s", m_targetFrameId.c_str(), e.what());
    return;
  }

  tf2::Transform latestTF(tf2::Quaternion(targetToMapTF.getRotation()), tf2::Vector3(targetToMapTF.getOrigin()));

  rclcpp::Time transformExpiration = time + rclcpp::Duration::from_seconds(m_transformTolerance);
  geometry_msgs::msg::TransformStamped tmp_tf_stamped;
  tmp_tf_stamped.header.stamp = transformExpiration;
  tmp_tf_stamped.header.frame_id = m_globalFrameId;
  tmp_tf_stamped.child_frame_id = m_targetFrameId;
  tmp_tf_stamped.transform = tf2::toMsg(latestTF.inverse());
  m_latest_transform.setData(latestTF.inverse());
  m_latest_transform.stamp_ = tf2::TimePoint(std::chrono::nanoseconds(time.nanoseconds()));
  m_latest_transform.frame_id_ = m_targetFrameId;

  m_tfBroadcaster->sendTransform(tmp_tf_stamped);
}

unsigned HumanoidLocalization::getBestParticleIdx() const {
  if (m_bestParticleIdx < 0 || m_bestParticleIdx >= m_numParticles) {
    RCLCPP_WARN(m_nh->get_logger(), "Index (%d) of best particle not valid, using 0 instead", m_bestParticleIdx);
    return 0;
  }

  return m_bestParticleIdx;
}

tf2::Transform HumanoidLocalization::getParticlePose(unsigned particleIdx) const {
  return m_particles.at(particleIdx).pose;
}

tf2::Transform HumanoidLocalization::getBestParticlePose() const {
  return getParticlePose(getBestParticleIdx());
}

tf2::Transform HumanoidLocalization::getMeanParticlePose() const {
  tf2::Transform meanPose = tf2::Transform::getIdentity();

  double totalWeight = 0.0;

  meanPose.setBasis(tf2::Matrix3x3(0, 0, 0, 0, 0, 0, 0, 0, 0));
  for (const auto& particle : m_particles) {
    meanPose.getOrigin() += particle.pose.getOrigin() * particle.weight;
    meanPose.getBasis()[0] += particle.pose.getBasis()[0];
    meanPose.getBasis()[1] += particle.pose.getBasis()[1];
    meanPose.getBasis()[2] += particle.pose.getBasis()[2];
    totalWeight += particle.weight;
  }
  assert(!std::isnan(totalWeight));

  meanPose.getOrigin() /= totalWeight;
  meanPose.getBasis() = meanPose.getBasis().scaled(tf2::Vector3(1.0 / m_numParticles, 1.0 / m_numParticles, 1.0 / m_numParticles));

  meanPose.setRotation(meanPose.getRotation().normalized());

  return meanPose;
}

double HumanoidLocalization::nEff() const {
  double sqrWeights = 0.0;
  for (const auto& particle : m_particles) {
    sqrWeights += (particle.weight * particle.weight);
  }

  if (sqrWeights > 0.0)
    return 1.0 / sqrWeights;
  else
    return 0.0;
}

void HumanoidLocalization::toLogForm() {
#pragma omp parallel for
  for (unsigned i = 0; i < m_particles.size(); ++i) {
    assert(m_particles[i].weight > 0.0);
    m_particles[i].weight = log(m_particles[i].weight);
  }
}

void HumanoidLocalization::pauseLocalizationSrvCallback(
    const std::shared_ptr<rmw_request_id_t>& request_header,
    const std::shared_ptr<std_srvs::srv::Trigger::Request>& req,
    std::shared_ptr<std_srvs::srv::Trigger::Response>& res) {
  m_paused = true;
  res->success = true;
  res->message = "Localization paused";
  RCLCPP_INFO(m_nh->get_logger(), "Localization paused");
}

void HumanoidLocalization::resumeLocalizationSrvCallback(
    const std::shared_ptr<rmw_request_id_t>& request_header,
    const std::shared_ptr<std_srvs::srv::Trigger::Request>& req,
    std::shared_ptr<std_srvs::srv::Trigger::Response>& res) {
  m_paused = false;
  res->success = true;
  res->message = "Localization resumed";
  RCLCPP_INFO(m_nh->get_logger(), "Localization resumed");
}

void HumanoidLocalization::pauseLocalizationCallback(
    const std_msgs::msg::Bool::SharedPtr msg) {
  m_paused = msg->data;
  RCLCPP_INFO(m_nh->get_logger(), "Localization %s", m_paused ? "paused" : "resumed");
}

bool HumanoidLocalization::lookupPoseHeight(const rclcpp::Time& stamp, double& poseHeight) const {
    tf2::Stamped<tf2::Transform> footprintToTorso;
    if (!m_motionModel->lookupLocalTransform(m_baseFootprintId, stamp, footprintToTorso)) {
      RCLCPP_WARN(m_nh->get_logger(), "Could not lookup transform from %s to %s", 
                m_baseFrameId.c_str(), m_baseFootprintId.c_str());
      return false;
    }
    
    poseHeight = footprintToTorso.getOrigin().getZ();
    return true;
}

}