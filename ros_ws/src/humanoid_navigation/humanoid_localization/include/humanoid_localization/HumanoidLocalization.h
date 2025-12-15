#ifndef HUMANOID_LOCALIZATION_HUMANOIDLOCALIZATION_H_
#define HUMANOID_LOCALIZATION_HUMANOIDLOCALIZATION_H_

#include <ctime>
#include <memory>
#include <random>


#include <rclcpp/rclcpp.hpp>
#include <tf2/LinearMath/Transform.hpp>
#include <tf2_ros/transform_listener.h>
#include <tf2_ros/transform_broadcaster.h>
#include <tf2_ros/message_filter.h>
#include <message_filters/subscriber.hpp>
#include <std_msgs/msg/float32.hpp>
#include <std_msgs/msg/bool.hpp>
#include <std_srvs/srv/trigger.hpp> // ubah empty menjadi trigger
#include <sensor_msgs/msg/laser_scan.hpp>
#include <sensor_msgs/msg/point_cloud2.hpp>
#include <sensor_msgs/msg/imu.hpp>

#include <pcl/point_cloud.h>
#include <pcl_conversions/pcl_conversions.h>
#include <pcl/point_types.h>
#include <pcl/sample_consensus/method_types.h>
#include <pcl/sample_consensus/model_types.h>
#include <pcl/segmentation/sac_segmentation.h>
#include <pcl/io/pcd_io.h>
#include <pcl/filters/extract_indices.h>
#include <pcl/filters/passthrough.h>

#include <geometry_msgs/msg/pose.hpp>
#include <geometry_msgs/msg/pose_array.hpp>
#include <geometry_msgs/msg/pose_with_covariance.hpp>
#include <geometry_msgs/msg/pose_with_covariance_stamped.hpp>

#include <humanoid_localization/humanoid_localization_defs.h>
#include <humanoid_localization/MotionModel.h>
#include <humanoid_localization/ObservationModel.h>
#include <humanoid_localization/RaycastingModel.h>
#ifndef SKIP_ENDPOINT_MODEL
  #include <humanoid_localization/EndpointModel.h>
#endif

#include <octomap/octomap.h>
#include <boost/circular_buffer.hpp>

namespace humanoid_localization{

static inline void getRP(const geometry_msgs::msg::Quaternion& msg_q, double& roll, double& pitch){
  tf2::Quaternion bt_q;
  tf2::fromMsg(msg_q, bt_q);
  double useless_yaw;
  tf2::Matrix3x3(bt_q).getRPY(roll, pitch, useless_yaw);

  if (std::abs(useless_yaw) > 0.00001)
    RCLCPP_WARN(rclcpp::get_logger("rclcpp"), "Non-zero yaw in IMU quaternion is ignored");
}

class HumanoidLocalization : public rclcpp::Node {
public:
  HumanoidLocalization(unsigned randomSeed);
  virtual ~HumanoidLocalization();
  virtual void laserCallback(const std::shared_ptr<const sensor_msgs::msg::LaserScan>& msg);
  virtual void pointCloudCallback(const std::shared_ptr<const sensor_msgs::msg::PointCloud2>& msg);
  void initPoseCallback(const std::shared_ptr<const geometry_msgs::msg::PoseWithCovarianceStamped>& msg);
  void globalLocalizationCallback(
      const std::shared_ptr<rmw_request_id_t>& request_header,
      const std::shared_ptr<std_srvs::srv::Trigger::Request>& req,
      std::shared_ptr<std_srvs::srv::Trigger::Response>& res);
  void pauseLocalizationSrvCallback(
      const std::shared_ptr<rmw_request_id_t>& request_header,
      const std::shared_ptr<std_srvs::srv::Trigger::Request>& req,
      std::shared_ptr<std_srvs::srv::Trigger::Response>& res);
  void resumeLocalizationSrvCallback(
      const std::shared_ptr<rmw_request_id_t>& request_header, 
      const std::shared_ptr<std_srvs::srv::Trigger::Request>& req, 
      std::shared_ptr<std_srvs::srv::Trigger::Response>& res);
  void pauseLocalizationCallback(const std_msgs::msg::Bool::SharedPtr msg);
  void imuCallback(const std::shared_ptr<const sensor_msgs::msg::Imu>& msg);

  void resample(unsigned numParticles = 0);
  unsigned getBestParticleIdx() const;
  tf2::Transform getParticlePose(unsigned particleIdx) const;
  tf2::Transform getBestParticlePose() const;
  tf2::Transform getMeanParticlePose() const;
  void initGlobal();
  void filterGroundPlane(const PointCloud& pc, PointCloud& ground, PointCloud& nonground,
                         double groundFilterDistance, double groundFilterAngle,
                         double groundFilterPlaneDistance) const;

protected:
  void reset();
  void publishPoseEstimate(const rclcpp::Time& time, bool publish_eval);
  void normalizeWeights();
  double getCumParticleWeight() const;
  double nEff() const;
  void toLogForm();
  bool getImuMsg(const rclcpp::Time& stamp, rclcpp::Time& imuStamp, double& angleX, double& angleY) const;
  void prepareLaserPointCloud(const std::shared_ptr<const sensor_msgs::msg::LaserScan>& laser, PointCloud& pc, std::vector<float>& ranges) const;
  void prepareGeneralPointCloud(const std::shared_ptr<const sensor_msgs::msg::PointCloud2>& msg, PointCloud& pc, std::vector<float>& ranges) const;
  int filterUniform(const PointCloud & cloud_in, PointCloud & cloud_out, int numSamples) const;
  void voxelGridSampling(const PointCloud & pc, pcl::PointCloud<int> & sampledIndices, double searchRadius) const;
  bool isAboveMotionThreshold(const tf2::Transform& odomTransform);
  bool localizeWithMeasurement(const PointCloud& pc_filtered, const std::vector<float>& ranges, double max_range);
  void constrainMotion(const tf2::Transform& odomPose);
  void timerCallback();
  unsigned computeBeamStep(unsigned numBeams) const;
  void initZRP(double& z, double& roll, double& pitch);
  bool lookupPoseHeight(const rclcpp::Time& t, double& poseHeight) const;

  EngineT m_rngEngine;
  NormalGeneratorT m_rngNormal;
  UniformGeneratorT m_rngUniform;
  std::shared_ptr<MotionModel> m_motionModel;
  std::shared_ptr<ObservationModel> m_observationModel;
  std::shared_ptr<MapModel> m_mapModel;

  rclcpp::Node::SharedPtr m_nh, m_privateNh;
  rclcpp::Subscription<std_msgs::msg::Bool>::SharedPtr m_pauseIntegrationSub;

  std::shared_ptr<message_filters::Subscriber<sensor_msgs::msg::LaserScan>> m_laserSub;
  std::shared_ptr<tf2_ros::MessageFilter<sensor_msgs::msg::LaserScan>> m_laserFilter;
  std::shared_ptr<message_filters::Subscriber<sensor_msgs::msg::PointCloud2>> m_pointCloudSub;
  std::shared_ptr<tf2_ros::MessageFilter<sensor_msgs::msg::PointCloud2>> m_pointCloudFilter;
  std::shared_ptr<message_filters::Subscriber<geometry_msgs::msg::PoseWithCovarianceStamped>> m_initPoseSub;
  std::shared_ptr<tf2_ros::MessageFilter<geometry_msgs::msg::PoseWithCovarianceStamped>> m_initPoseFilter;

  // rclcpp::Publisher<geometry_msgs::msg::PoseStamped>::SharedPtr m_posePub, m_poseEvalPub, m_poseOdomPub, m_poseTruePub,
  //                m_poseArrayPub, m_bestPosePub, m_nEffPub,
  //                m_filteredPointCloudPub;
  rclcpp::Publisher<geometry_msgs::msg::PoseWithCovarianceStamped>::SharedPtr m_posePub, m_poseEvalPub;
  rclcpp::Publisher<geometry_msgs::msg::PoseStamped>::SharedPtr m_poseOdomPub, m_poseTruePub;
  rclcpp::Publisher<geometry_msgs::msg::PoseArray>::SharedPtr m_poseArrayPub, m_bestPosePub;
  rclcpp::Publisher<std_msgs::msg::Float32>::SharedPtr m_nEffPub;
  rclcpp::Publisher<sensor_msgs::msg::PointCloud2>::SharedPtr m_filteredPointCloudPub;
  rclcpp::Subscription<sensor_msgs::msg::Imu>::SharedPtr m_imuSub;
  rclcpp::Service<std_srvs::srv::Trigger>::SharedPtr m_globalLocSrv, m_pauseLocSrv, m_resumeLocSrv;
  std::shared_ptr<tf2_ros::TransformListener> m_tfListener;
  std::shared_ptr<tf2_ros::TransformBroadcaster> m_tfBroadcaster;
  rclcpp::TimerBase::SharedPtr m_timer;

  std::shared_ptr<tf2_ros::Buffer> m_tfBuffer;

  std::string m_odomFrameId;
  std::string m_targetFrameId;
  std::string m_baseFrameId;
  std::string m_baseFootprintId;
  std::string m_globalFrameId;

  bool m_useRaycasting;
  bool m_initFromTruepose;
  int m_numParticles;
  double m_sensorSampleDist;

  double m_nEffFactor;
  double m_minParticleWeight;
  Vector6d m_initPose;
  Vector6d m_initNoiseStd;
  bool m_initPoseRealZRP;

  double m_filterMaxRange;
  double m_filterMinRange;

  Particles m_particles;
  int m_bestParticleIdx;
  tf2::Transform m_odomPose;
  geometry_msgs::msg::PoseArray m_poseArray;
  boost::circular_buffer<sensor_msgs::msg::Imu> m_lastIMUMsgBuffer;

  bool m_bestParticleAsMean;
  bool m_receivedSensorData;
  bool m_initialized;
  bool m_initGlobal;
  bool m_paused;
  bool m_syncedTruepose;

  double m_observationThresholdTrans;
  double m_observationThresholdRot;
  double m_observationThresholdHeadYawRot;
  double m_observationThresholdHeadPitchRot;
  double m_temporalSamplingRange;
  double m_transformTolerance;
  rclcpp::Time m_lastLaserTime;
  rclcpp::Time m_lastPointCloudTime;

  bool m_groundFilterPointCloud;
  double m_groundFilterDistance;
  double m_groundFilterAngle;
  double m_groundFilterPlaneDistance;
  double m_sensorSampleDistGroundFactor;

  tf2::Transform m_lastLocalizedPose;
  tf2::Stamped<tf2::Transform> m_latest_transform;

  double m_headYawRotationLastScan;
  double m_headPitchRotationLastScan;

  bool m_useIMU;
  bool m_constrainMotionZ;
  bool m_constrainMotionRP;

  bool m_useTimer;
  double m_timerPeriod;
};
}

#endif
