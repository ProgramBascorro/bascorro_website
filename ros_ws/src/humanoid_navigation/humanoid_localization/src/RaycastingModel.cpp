/*
 * 6D localization for humanoid robots
 *
 * Copyright 2009-2012 Armin Hornung, University of Freiburg
 * http://www.ros.org/wiki/humanoid_localization
 *
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#include <humanoid_localization/RaycastingModel.h>
#include <humanoid_localization/octomap_utils.h>
#include <humanoid_localization/transform_utils.h>
#include <humanoid_localization/tf2_utils.h>
#include <pcl/point_types.h>
#include <pcl_conversions/pcl_conversions.h>
#include <pcl/common/transforms.h>
#include <octomap_ros/conversions.hpp>
#include <rclcpp/rclcpp.hpp>
#include <Eigen/Geometry>
// fromMsg
namespace humanoid_localization{

RaycastingModel::RaycastingModel(rclcpp::Node::SharedPtr nh, std::shared_ptr<MapModel> mapModel, EngineT * rngEngine)
: ObservationModel(nh, mapModel, rngEngine)
{
  nh->get_parameter_or("raycasting/z_hit", m_zHit, 0.8);
  nh->get_parameter_or("raycasting/z_short", m_zShort, 0.1);
  nh->get_parameter_or("raycasting/z_max", m_zMax, 0.05);
  nh->get_parameter_or("raycasting/z_rand", m_zRand, 0.05);
  nh->get_parameter_or("raycasting/sigma_hit", m_sigmaHit, 0.02);
  nh->get_parameter_or("raycasting/lambda_short", m_lambdaShort, 0.1);

  if (m_zMax <= 0.0){
    RCLCPP_ERROR(nh->get_logger(), "raycasting/z_max needs to be > 0.0");
  }

  if (m_zRand <= 0.0){
    RCLCPP_ERROR(nh->get_logger(), "raycasting/z_rand needs to be > 0.0");
  }
   #pragma omp parallel
   #pragma omp critical
    {
      if (omp_get_thread_num() == 0){
        RCLCPP_INFO(nh->get_logger(), "Using %d threads in RaycastingModel", omp_get_num_threads());
      }
    }
}

RaycastingModel::~RaycastingModel(){

}

// void transformAsMatrix(const tf2::Transform& t, Eigen::Matrix4f& matrix)
// {
//   // Create a 3x3 rotation matrix from the tf2 quaternion
//   tf2::Matrix3x3 rot = t.getBasis();
  
//   // Fill the rotation part of the 4x4 transformation matrix
//   for (int i = 0; i < 3; i++) {
//     for (int j = 0; j < 3; j++) {
//       matrix(i, j) = rot[i][j];
//     }
//   }
  
//   // Fill the translation part
//   matrix(0, 3) = t.getOrigin().x();
//   matrix(1, 3) = t.getOrigin().y();
//   matrix(2, 3) = t.getOrigin().z();
  
//   // Fill the bottom row
//   matrix(3, 0) = 0.0;
//   matrix(3, 1) = 0.0;
//   matrix(3, 2) = 0.0;
//   matrix(3, 3) = 1.0;
// }

void RaycastingModel::integrateMeasurement(Particles& particles, const PointCloud& pc, const std::vector<float>& ranges, float max_range, const tf2::Transform& base_to_laser){
  assert(pc.size() == ranges.size());

  if (!m_map){
    RCLCPP_ERROR(rclcpp::get_logger("rclcpp"), "Map file is not set in raycasting");
    return;
  }
#pragma omp parallel for
  for (unsigned i=0; i < particles.size(); ++i){
    Eigen::Matrix4f globalLaserOrigin;
    tf2::Transform globalLaserOriginTf = particles[i].pose * base_to_laser;
    transformAsMatrix(globalLaserOriginTf, globalLaserOrigin);

    octomap::point3d originP(globalLaserOriginTf.getOrigin().x(),
                             globalLaserOriginTf.getOrigin().y(),
                             globalLaserOriginTf.getOrigin().z());
    PointCloud pc_transformed;
    pcl::transformPointCloud(pc, pc_transformed, globalLaserOrigin);

    PointCloud::const_iterator pc_it = pc_transformed.begin();
    std::vector<float>::const_iterator ranges_it = ranges.begin();
    for ( ; pc_it != pc_transformed.end(); ++pc_it, ++ranges_it){

      double p = 0.0;

      if (*ranges_it <= max_range){

        octomap::point3d direction(pc_it->x , pc_it->y, pc_it->z);
        direction = direction - originP;

        octomap::point3d end;
        if(m_map->castRay(originP,direction, end, true, 1.5*max_range)){
          assert(m_map->isNodeOccupied(m_map->search(end)));
          float raycastRange = (originP - end).norm();
          float z = raycastRange - *ranges_it;
          float sigma_scaled = m_sigmaHit;
          if (m_use_squared_error)
             sigma_scaled = (*ranges_it) * (*ranges_it) * (m_sigmaHit);

          p = m_zHit / (SQRT_2_PI * sigma_scaled) * exp(-(z * z) / (2 * sigma_scaled * sigma_scaled));

          if (*ranges_it <= raycastRange)
            p += m_zShort * m_lambdaShort * exp(-m_lambdaShort* (*ranges_it)) / (1-exp(-m_lambdaShort*raycastRange));

          p += m_zRand / max_range;
        } else {
          p = m_zRand / max_range;
        }

      } else{
        p = m_zMax;
      }

      assert(p > 0.0);
      particles[i].weight += log(p);

    }

  }

}

bool RaycastingModel::getHeightError(const Particle& p, const tf2::Transform& footprintToBase, double& heightError) const{

  octomap::point3d direction = octomap::pointTfToOctomap(footprintToBase.inverse().getOrigin());
  octomap::point3d origin = octomap::pointTfToOctomap(p.pose.getOrigin());
  octomap::point3d end;
  if (!m_map->castRay(origin, direction, end, true, 2*direction.norm()))
    return false;

  heightError =  std::max(0.0, std::abs((origin-end).z() - footprintToBase.getOrigin().z()) - m_map->getResolution());

  return true;
}

}
