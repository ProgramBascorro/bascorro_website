#include <humanoid_localization/transform_utils.h>

namespace humanoid_localization {

void transformAsMatrix(const tf2::Transform& t, Eigen::Matrix4f& matrix) {
  // Create a 3x3 rotation matrix from the tf2 quaternion
  tf2::Matrix3x3 rot = t.getBasis();
  
  // Fill the rotation part of the 4x4 transformation matrix
  for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
      matrix(i, j) = rot[i][j];
    }
  }
  
  // Fill the translation part
  matrix(0, 3) = t.getOrigin().x();
  matrix(1, 3) = t.getOrigin().y();
  matrix(2, 3) = t.getOrigin().z();
  
  // Fill the bottom row
  matrix(3, 0) = 0.0;
  matrix(3, 1) = 0.0;
  matrix(3, 2) = 0.0;
  matrix(3, 3) = 1.0;
}

}