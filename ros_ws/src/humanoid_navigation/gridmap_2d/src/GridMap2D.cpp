#include "gridmap_2d/GridMap2D.h"
#include <rclcpp/rclcpp.hpp>

namespace gridmap_2d {

GridMap2D::GridMap2D()
: m_frameId("/map")
{
}

GridMap2D::GridMap2D(const nav_msgs::msg::OccupancyGrid::ConstSharedPtr& gridMap, bool unknown_as_obstacle) {
  setMap(gridMap, unknown_as_obstacle);
}

GridMap2D::GridMap2D(const GridMap2D& other)
 : m_binaryMap(other.m_binaryMap.clone()),
   m_distMap(other.m_distMap.clone()),
   m_mapInfo(other.m_mapInfo),
   m_frameId(other.m_frameId)
{
}

GridMap2D::~GridMap2D() {
}

void GridMap2D::updateDistanceMap() {
  cv::distanceTransform(m_binaryMap, m_distMap, cv::DIST_L2, cv::DIST_MASK_PRECISE);
  m_distMap = m_distMap * m_mapInfo.resolution;
}

void GridMap2D::setMap(const nav_msgs::msg::OccupancyGrid::ConstSharedPtr& grid_map, bool unknown_as_obstacle) {
  m_mapInfo = grid_map->info;
  m_frameId = grid_map->header.frame_id;
  m_binaryMap = cv::Mat(m_mapInfo.width, m_mapInfo.height, CV_8UC1);
  m_distMap = cv::Mat(m_binaryMap.size(), CV_32FC1);

  std::vector<int8_t>::const_iterator mapDataIter = grid_map->data.begin();
  unsigned char map_occ_thres = 70;

  for (unsigned int j = 0; j < m_mapInfo.height; ++j) {
    for (unsigned int i = 0; i < m_mapInfo.width; ++i) {
      if (*mapDataIter > map_occ_thres || (unknown_as_obstacle && *mapDataIter < 0)) {
        m_binaryMap.at<uchar>(i, j) = OCCUPIED;
      } else {
        m_binaryMap.at<uchar>(i, j) = FREE;
      }
      ++mapDataIter;
    }
  }

  updateDistanceMap();

  RCLCPP_INFO(rclcpp::get_logger("gridmap_2d"), "GridMap2D created with %d x %d cells at %f resolution.", m_mapInfo.width, m_mapInfo.height, m_mapInfo.resolution);
}

nav_msgs::msg::OccupancyGrid GridMap2D::toOccupancyGridMsg() const {
  nav_msgs::msg::OccupancyGrid msg;
  msg.header.frame_id = m_frameId;
  msg.header.stamp = rclcpp::Clock().now();
  msg.info = m_mapInfo;
  msg.data.resize(msg.info.height * msg.info.width);

  std::vector<int8_t>::iterator mapDataIter = msg.data.begin();
  for (unsigned int j = 0; j < m_mapInfo.height; ++j) {
    for (unsigned int i = 0; i < m_mapInfo.width; ++i) {
      if (m_binaryMap.at<uchar>(i, j) == OCCUPIED)
        *mapDataIter = 100;
      else
        *mapDataIter = 0;

      ++mapDataIter;
    }
  }

  return msg;
}

void GridMap2D::setMap(const cv::Mat& binaryMap) {
  m_binaryMap = binaryMap.clone();
  m_distMap = cv::Mat(m_binaryMap.size(), CV_32FC1);

  cv::distanceTransform(m_binaryMap, m_distMap, cv::DIST_L2, cv::DIST_MASK_PRECISE);
  m_distMap = m_distMap * m_mapInfo.resolution;

  RCLCPP_INFO(rclcpp::get_logger("gridmap_2d"), "GridMap2D copied from existing cv::Mat with %d x %d cells at %f resolution.", m_mapInfo.width, m_mapInfo.height, m_mapInfo.resolution);
}

void GridMap2D::inflateMap(double inflationRadius) {
  m_binaryMap = (m_distMap > inflationRadius);
  cv::distanceTransform(m_binaryMap, m_distMap, cv::DIST_L2, cv::DIST_MASK_PRECISE);
  m_distMap = m_distMap * m_mapInfo.resolution;
}

void GridMap2D::mapToWorld(unsigned int mx, unsigned int my, double& wx, double& wy) const {
  wx = m_mapInfo.origin.position.x + (mx + 0.5) * m_mapInfo.resolution;
  wy = m_mapInfo.origin.position.y + (my + 0.5) * m_mapInfo.resolution;
}

void GridMap2D::worldToMapNoBounds(double wx, double wy, unsigned int& mx, unsigned int& my) const {
  mx = static_cast<int>((wx - m_mapInfo.origin.position.x) / m_mapInfo.resolution);
  my = static_cast<int>((wy - m_mapInfo.origin.position.y) / m_mapInfo.resolution);
}

bool GridMap2D::worldToMap(double wx, double wy, unsigned int& mx, unsigned int& my) const {
  if (wx < m_mapInfo.origin.position.x || wy < m_mapInfo.origin.position.y)
    return false;

  mx = static_cast<int>((wx - m_mapInfo.origin.position.x) / m_mapInfo.resolution);
  my = static_cast<int>((wy - m_mapInfo.origin.position.y) / m_mapInfo.resolution);

  if (mx < m_mapInfo.width && my < m_mapInfo.height)
    return true;

  return false;
}

bool GridMap2D::inMapBounds(double wx, double wy) const {
  unsigned mx, my;
  return worldToMap(wx, wy, mx, my);
}

float GridMap2D::distanceMapAt(double wx, double wy) const {
  unsigned mx, my;

  if (worldToMap(wx, wy, mx, my))
    return m_distMap.at<float>(mx, my);
  else
    return -1.0f;
}

uchar GridMap2D::binaryMapAt(double wx, double wy) const {
  unsigned mx, my;

  if (worldToMap(wx, wy, mx, my))
    return m_binaryMap.at<uchar>(mx, my);
  else
    return 0;
}

float GridMap2D::distanceMapAtCell(unsigned int mx, unsigned int my) const {
  return m_distMap.at<float>(mx, my);
}

uchar GridMap2D::binaryMapAtCell(unsigned int mx, unsigned int my) const {
  return m_binaryMap.at<uchar>(mx, my);
}

uchar& GridMap2D::binaryMapAtCell(unsigned int mx, unsigned int my) {
  return m_binaryMap.at<uchar>(mx, my);
}

bool GridMap2D::isOccupiedAtCell(unsigned int mx, unsigned int my) const {
  return (m_binaryMap.at<uchar>(mx, my) < 255);
}

bool GridMap2D::isOccupiedAt(double wx, double wy) const {
  unsigned mx, my;
  if (worldToMap(wx, wy, mx, my))
    return isOccupiedAtCell(mx, my);
  else
    return true;
}

}