#ifndef HUMANOID_LOCALIZATION_OCTOMAP_UTILS_H
#define HUMANOID_LOCALIZATION_OCTOMAP_UTILS_H

#include <octomap_msgs/msg/octomap.hpp>
#include <octomap/OcTree.h>
#include <octomap_msgs/conversions.h>

namespace humanoid_localization {
  // Using inline to ensure single definition
  inline octomap::OcTree fromMsg(const octomap_msgs::msg::Octomap& octomap_msg) {
    if (octomap_msg.binary) {
      octomap::AbstractOcTree* tree = octomap_msgs::binaryMsgToMap(octomap_msg);
      if (!tree) {
        return octomap::OcTree(0.1); // Default resolution
      }
      
      octomap::OcTree* octree = dynamic_cast<octomap::OcTree*>(tree);
      if (!octree) {
        delete tree;
        return octomap::OcTree(0.1);
      }
      
      octomap::OcTree result(*octree);
      delete octree;
      return result;
    } 
    else {
      octomap::AbstractOcTree* tree = octomap_msgs::fullMsgToMap(octomap_msg);
      if (!tree) {
        return octomap::OcTree(0.1);
      }
      
      octomap::OcTree* octree = dynamic_cast<octomap::OcTree*>(tree);
      if (!octree) {
        delete tree;
        return octomap::OcTree(0.1);
      }
      
      octomap::OcTree result(*octree);
      delete octree;
      return result;
    }
  }
}

#endif