#ifndef HUMANOID_LOCALIZATION_TF2_UTILS_H
#define HUMANOID_LOCALIZATION_TF2_UTILS_H

#include <tf2/convert.hpp>
#include <tf2/LinearMath/Transform.hpp>
#include <tf2_geometry_msgs/tf2_geometry_msgs.hpp>  // Include existing conversions
#include <rclcpp/time.hpp>  // For timestamp handling

namespace tf2 {

// Convert from geometry_msgs::msg::Pose to tf2::Stamped<tf2::Transform>
inline void fromMsg(const geometry_msgs::msg::Pose& in, tf2::Stamped<tf2::Transform>& out) {
  tf2::Transform tmp;
  fromMsg(in, tmp);  // This will use the existing fromMsg
  out.setData(tmp);
}

// Convert from geometry_msgs::msg::Transform to tf2::Stamped<tf2::Transform>
inline void fromMsg(const geometry_msgs::msg::Transform& in, tf2::Stamped<tf2::Transform>& out) {
  tf2::Transform tmp;
  fromMsg(in, tmp);  // This will use the existing fromMsg
  out.setData(tmp);
}

// Implement doTransform for Stamped<Transform>
template<>
inline void doTransform(const tf2::Stamped<tf2::Transform>& in, 
                 tf2::Stamped<tf2::Transform>& out,
                 const geometry_msgs::msg::TransformStamped& transform) {
  tf2::Transform t;
  fromMsg(transform.transform, t);
  out.setData(t * in);
  
  // Fix for timestamp conversion
  rclcpp::Time ros_time(transform.header.stamp);
  out.stamp_ = tf2::TimePoint(std::chrono::nanoseconds(ros_time.nanoseconds()));
  
  out.frame_id_ = transform.header.frame_id;
}

} // namespace tf2

#endif // HUMANOID_LOCALIZATION_TF2_UTILS_H