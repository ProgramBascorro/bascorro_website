#ifndef HUMANOID_LOCALIZATION_MAPMODEL_H_
#define HUMANOID_LOCALIZATION_MAPMODEL_H_

#include <rclcpp/rclcpp.hpp>
#include <octomap/octomap.h>
#include <humanoid_localization/octomap_utils.h>
#include <octomap_msgs/msg/octomap.hpp>
#include <octomap_msgs/srv/get_octomap.hpp>
#include <humanoid_localization/humanoid_localization_defs.h>
#include <tf2/LinearMath/Transform.hpp>
#include <geometry_msgs/msg/pose.hpp>

namespace humanoid_localization{

// // Fungsi konversi dari ROS 2 message ke octomap
// octomap::OcTree fromMsg(const octomap_msgs::msg::Octomap& msg) {
//     std::stringstream datastream;
//     datastream.write(reinterpret_cast<const char*>(msg.data.data()), msg.data.size());
//     octomap::OcTree octree(msg.resolution);
//     octree.readBinaryData(datastream);
//     return octree;
// }

// Fungsi konversi dari octomap ke ROS 2 message
inline octomap_msgs::msg::Octomap toMsg(const octomap::OcTree& octree) {
    octomap_msgs::msg::Octomap msg;
    msg.header.frame_id = "map";
    msg.binary = false;
    msg.id = "OcTree";
    msg.resolution = octree.getResolution();
    std::stringstream datastream;
    octree.writeBinaryData(datastream);
    std::string data_string = datastream.str();
    msg.data.resize(data_string.size());
    for (size_t i = 0; i < data_string.size(); ++i) {
        msg.data[i] = static_cast<int8_t>(data_string[i]);
    }
    
    return msg;
}

class MapModel{
public:
  MapModel(rclcpp::Node::SharedPtr nh);
  virtual ~MapModel();

  std::shared_ptr<octomap::OcTree> getMap() const;
  virtual void verifyPoses(Particles& particles);
  virtual void initGlobal(Particles& particles,
                          double z, double roll, double pitch,
                          const Vector6d& initNoise,
                          UniformGeneratorT& rngUniform, NormalGeneratorT& rngNormal);
  virtual bool isOccupied(const octomap::point3d& position) const;
  virtual bool isOccupied(octomap::OcTreeNode* node) const = 0;
  virtual double getFloorHeight(const tf2::Transform& pose) const = 0;
  void getHeightlist(double x, double y, double totalHeight, std::vector<double>& heights);

protected:
  rclcpp::Node::SharedPtr nh;
  std::shared_ptr<octomap::OcTree> m_map;
  EngineT* m_rngEngine;
  double m_motionMeanZ;
  double m_motionRangeZ;
  double m_motionRangeRoll;
  double m_motionRangePitch;
  double m_motionObstacleDist;
};

class DistanceMap : public MapModel{
public:
  DistanceMap(rclcpp::Node::SharedPtr nh);
  virtual ~DistanceMap();
  virtual bool isOccupied(octomap::OcTreeNode* node) const;
  virtual double getFloorHeight(const tf2::Transform& pose) const override;
};

class OccupancyMap : public MapModel{
public:
  OccupancyMap(rclcpp::Node::SharedPtr nh);
  virtual ~OccupancyMap();
  virtual bool isOccupied(octomap::OcTreeNode* node) const;
  virtual double getFloorHeight(const tf2::Transform& pose) const override;
};

}

#endif // HUMANOID_LOCALIZATION_MAPMODEL_H_