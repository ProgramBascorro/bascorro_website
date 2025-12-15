#ifndef GRIDMAP2D_GRIDMAP2D_H_
#define GRIDMAP2D_GRIDMAP2D_H_

#include <opencv2/core/core.hpp>
#include <opencv2/imgproc/imgproc.hpp>
#include <nav_msgs/msg/occupancy_grid.hpp>
#include <opencv2/core/types_c.h>
#include <memory>

namespace gridmap_2d {

class GridMap2D {
public:
  GridMap2D();
  GridMap2D(const nav_msgs::msg::OccupancyGrid::ConstSharedPtr& grid_map, bool unknown_as_obstacle = false);
  GridMap2D(const GridMap2D& other);
  virtual ~GridMap2D();

  void mapToWorld(unsigned int mx, unsigned int my, double& wx, double& wy) const;
  bool worldToMap(double wx, double wy, unsigned int& mx, unsigned int& my) const;
  void worldToMapNoBounds(double wx, double wy, unsigned int& mx, unsigned int& my) const;
  bool inMapBounds(double wx, double wy) const;
  void inflateMap(double inflationRaduis);

  inline double worldDist(unsigned x1, unsigned y1, unsigned x2, unsigned y2) {
    return worldDist(cv::Point(x1, y1), cv::Point(x2, y2));
  }

  inline double worldDist(const cv::Point& p1, const cv::Point& p2) {
    return GridMap2D::pointDist(p1, p2) * m_mapInfo.resolution;
  }

  static inline double pointDist(const cv::Point& p1, const cv::Point& p2) {
    return sqrt(pointDist2(p1, p2));
  }

  static inline double pointDist2(const cv::Point& p1, const cv::Point& p2) {
    return (p1.x - p2.x)*(p1.x - p2.x) + (p1.y - p2.y)*(p1.y - p2.y);
  }

  float distanceMapAt(double wx, double wy) const;
  float distanceMapAtCell(unsigned int mx, unsigned int my) const;
  uchar binaryMapAt(double wx, double wy) const;
  uchar binaryMapAtCell(unsigned int mx, unsigned int my) const;
  uchar& binaryMapAtCell(unsigned int mx, unsigned int my);
  bool isOccupiedAt(double wx, double wy) const;
  bool isOccupiedAtCell(unsigned int mx, unsigned int my) const;
  void setMap(const nav_msgs::msg::OccupancyGrid::ConstSharedPtr& grid_map, bool unknown_as_obstacle = false);
  nav_msgs::msg::OccupancyGrid toOccupancyGridMsg() const;
  void setMap(const cv::Mat& binary_map);
  void updateDistanceMap();

  inline const nav_msgs::msg::MapMetaData& getInfo() const { return m_mapInfo; }
  inline float getResolution() const { return m_mapInfo.resolution; }
  inline const std::string getFrameID() const { return m_frameId; }
  const cv::Mat& distanceMap() const { return m_distMap; }
  const cv::Mat& binaryMap() const { return m_binaryMap; }
  inline const cv::Size size() const { return m_binaryMap.size(); }

  const static uchar FREE = 255;
  const static uchar OCCUPIED = 0;

protected:
  cv::Mat m_binaryMap;
  cv::Mat m_distMap;
  nav_msgs::msg::MapMetaData m_mapInfo;
  std::string m_frameId;
};

typedef std::shared_ptr<GridMap2D> GridMap2DPtr;
typedef std::shared_ptr<const GridMap2D> GridMap2DConstPtr;

}

#endif /* GRIDMAP2D_H_ */