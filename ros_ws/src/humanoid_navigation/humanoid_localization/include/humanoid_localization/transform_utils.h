#ifndef HUMANOID_LOCALIZATION_TRANSFORM_UTILS_H
#define HUMANOID_LOCALIZATION_TRANSFORM_UTILS_H

#include <tf2/LinearMath/Transform.hpp> // Note .hpp extension
#include <Eigen/Core>

namespace humanoid_localization {
  // Declaration of transform utility functions
  void transformAsMatrix(const tf2::Transform& t, Eigen::Matrix4f& matrix);
}

#endif // HUMANOID_LOCALIZATION_TRANSFORM_UTILS_H