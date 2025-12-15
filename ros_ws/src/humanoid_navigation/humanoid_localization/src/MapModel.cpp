#include <humanoid_localization/MapModel.h>
#include <humanoid_localization/octomap_utils.h>
#include <humanoid_localization/transform_utils.h>
// fromMsg
namespace humanoid_localization {
MapModel::MapModel(rclcpp::Node::SharedPtr nh)
: nh(nh),
m_rngEngine(nullptr),
  m_motionMeanZ(0.0),
  m_motionRangeZ(-1.0), m_motionRangeRoll(-1.0), m_motionRangePitch(-1.0),
  m_motionObstacleDist(0.2)
{
  nh->declare_parameter("motion_mean_z", m_motionMeanZ);
  nh->declare_parameter("motion_range_z", m_motionRangeZ);
  nh->declare_parameter("motion_range_roll", m_motionRangeRoll);
  nh->declare_parameter("motion_range_pitch", m_motionRangePitch);
  nh->get_parameter("motion_mean_z", m_motionMeanZ);
  nh->get_parameter("motion_range_z", m_motionRangeZ);
  nh->get_parameter("motion_range_roll", m_motionRangeRoll);
  nh->get_parameter("motion_range_pitch", m_motionRangePitch);
}

MapModel::~MapModel() {}

std::shared_ptr<octomap::OcTree> MapModel::getMap() const {
  return m_map;
}

void MapModel::verifyPoses(Particles& particles) {
  double minX, minY, minZ, maxX, maxY, maxZ;
  m_map->getMetricMin(minX, minY, minZ);
  m_map->getMetricMax(maxX, maxY, maxZ);

  double minWeight = std::numeric_limits<double>::max();
  for (auto& particle : particles) {
    if (particle.weight < minWeight)
      minWeight = particle.weight;
  }

  minWeight -= 200;
  unsigned numWall = 0;
  unsigned numOut = 0;
  unsigned numMotion = 0;

  #pragma omp parallel for
  for (unsigned i = 0; i < particles.size(); ++i) {
    octomap::point3d position(particles[i].pose.getOrigin().getX(),
                              particles[i].pose.getOrigin().getY(),
                              particles[i].pose.getOrigin().getZ());

    if (position(0) < minX || position(0) > maxX
        || position(1) < minY || position(1) > maxY
        || position(2) < minZ || position(2) > maxZ) {
      particles[i].weight = minWeight;
      #pragma omp atomic
      numOut++;
    } else {
      if (this->isOccupied(position)) {
        particles[i].weight = minWeight;
        #pragma omp atomic
        numWall++;
      } else {
        if (m_motionRangeZ >= 0.0 &&
            (std::abs(particles[i].pose.getOrigin().getZ() - getFloorHeight(particles[i].pose) - m_motionMeanZ)
              > m_motionRangeZ)) {
          particles[i].weight = minWeight;
          #pragma omp atomic
          numMotion++;
        } else if (m_motionRangePitch >= 0.0 || m_motionRangeRoll >= 0.0) {
          double yaw, pitch, roll;
          particles[i].pose.getBasis().getRPY(roll, pitch, yaw);

          if ((m_motionRangePitch >= 0.0 && std::abs(pitch) > m_motionRangePitch)
              || (m_motionRangeRoll >= 0.0 && std::abs(roll) > m_motionRangeRoll)) {
            particles[i].weight = minWeight;
            #pragma omp atomic
            numMotion++;
          }
        }
      }
    }
  }

  if (numWall > 0 || numOut > 0 || numMotion > 0) {
    RCLCPP_INFO(nh->get_logger(), "Particle weights minimized: %d out of map, %d in obstacles, %d out of motion range", numOut, numWall, numMotion);
  }

  if (numOut + numWall >= particles.size()) {
    RCLCPP_WARN(nh->get_logger(), "All particles are out of the valid map area or in obstacles!");
  }
}

void MapModel::initGlobal(Particles& particles, double z, double roll, double pitch,
                          const Vector6d& initNoise,
                          UniformGeneratorT& rngUniform, NormalGeneratorT& rngNormal) {
  double sizeX, sizeY, sizeZ, minX, minY, minZ;
  m_map->getMetricSize(sizeX, sizeY, sizeZ);
  m_map->getMetricMin(minX, minY, minZ);

  double weight = 1.0 / particles.size();
  auto it = particles.begin();

  std::random_device rd;
  std::mt19937 localGen(rd());
  EngineT& gen = m_rngEngine ? *m_rngEngine : localGen;

  while (true) {
    if (it == particles.end())
      break;

    double x = minX + sizeX * rngUniform(gen);
    double y = minY + sizeY * rngUniform(gen);
    std::vector<double> z_list;
    getHeightlist(x, y, 0.6, z_list);

    for (unsigned zIdx = 0; zIdx < z_list.size(); zIdx++) {
      if (it == particles.end())
        break;

      it->pose.getOrigin().setX(x);
      it->pose.getOrigin().setY(y);
      it->pose.getOrigin().setZ(z_list.at(zIdx) + z + rngNormal(gen) * initNoise(2));
      double yaw = rngUniform(gen) * 2 * M_PI - M_PI;
      tf2::Quaternion q;
      q.setRPY(roll, pitch, yaw);
      it->pose.setRotation(q);
      it->weight = weight;
      it++;
    }
  }
}

void MapModel::getHeightlist(double x, double y, double totalHeight, std::vector<double>& heights) {
  double minX, minY, minZ, maxX, maxY, maxZ;
  m_map->getMetricMin(minX, minY, minZ);
  m_map->getMetricMax(maxX, maxY, maxZ);

  double res = m_map->getResolution();
  double z = maxZ - res / 2.0;
  double lastZ = z + res;

  while (z >= minZ) {
    if (isOccupied(octomap::point3d(x, y, z))) {
      if (lastZ - z >= totalHeight + res) {
        heights.push_back(z + res / 2.0);
      }
      lastZ = z;
    }
    z -= res;
  }
}

bool MapModel::isOccupied(const octomap::point3d& position) const {
  octomap::OcTreeNode* mapNode = m_map->search(position);
  if (mapNode)
    return isOccupied(mapNode);
  else return false;
}

DistanceMap::DistanceMap(rclcpp::Node::SharedPtr nh)
: MapModel(nh) {
  RCLCPP_ERROR(nh->get_logger(), "Distance map implementation is currently not supported");
  std::string mapFileName;
  nh->declare_parameter("map_file_dist", mapFileName);
  nh->get_parameter("map_file_dist", mapFileName);

  octomap::OcTree* tree = dynamic_cast<octomap::OcTree*>(octomap::AbstractOcTree::read(mapFileName));
  if (tree) {
    m_map.reset(tree);
  }

  if (!m_map || m_map->size() <= 1) {
    RCLCPP_ERROR(nh->get_logger(), "Distance map file loaded from \"%s\" is erroneous, exiting...", mapFileName.c_str());
    exit(-1);
  }
  double x, y, z;
  m_map->getMetricSize(x, y, z);
  RCLCPP_INFO(nh->get_logger(), "Distance map initialized with %zd nodes (%.2f x %.2f x %.2f m)", m_map->size(), x, y, z);
}

DistanceMap::~DistanceMap() {}

bool DistanceMap::isOccupied(octomap::OcTreeNode* node) const {
  if (std::abs(node->getLogOdds()) < m_map->getResolution())
    return true;
  else
    return false;
}

double DistanceMap::getFloorHeight(const tf2::Transform& pose) const {
  RCLCPP_ERROR(nh->get_logger(), "DistanceMap::getFloorHeight not implemented yet!");
  return 0.0;
}

OccupancyMap::OccupancyMap(rclcpp::Node::SharedPtr nh)
: MapModel(nh) {
  std::string servname = "octomap_binary";
  RCLCPP_INFO(nh->get_logger(), "Requesting the map from %s...", servname.c_str());
  auto client = nh->create_client<octomap_msgs::srv::GetOctomap>(servname);
  auto request = std::make_shared<octomap_msgs::srv::GetOctomap::Request>();

  while (!client->wait_for_service(std::chrono::seconds(1))) {
    if (!rclcpp::ok()) {
      RCLCPP_ERROR(nh->get_logger(), "Interrupted while waiting for the service. Exiting.");
      return;
    }
    RCLCPP_WARN(nh->get_logger(), "Service not available, waiting again...");
  }

  auto result = client->async_send_request(request);
  if (rclcpp::spin_until_future_complete(nh, result) == rclcpp::FutureReturnCode::SUCCESS) {
    auto response = result.get();
    // m_map.reset(dynamic_cast<octomap::OcTree*>(octomap_msgs::fullMsgToMap(response->map)));
    m_map.reset(dynamic_cast<octomap::OcTree*>(octomap::AbstractOcTree::createTree(
                response->map.id, response->map.resolution)));
    octomap::AbstractOcTree* tree = nullptr;
    std::stringstream datastream;
    try {
      datastream.write(reinterpret_cast<const char*>(response->map.data.data()), 
                      response->map.data.size());
      
      tree = octomap::AbstractOcTree::createTree(response->map.id, response->map.resolution);
      if (tree) {
        if (!tree->readData(datastream)) {
          delete tree;
          tree = nullptr;
          RCLCPP_ERROR(nh->get_logger(), "Failed to read octree data from stream");
        } else {
          // Successfully created the tree, now set m_map
          m_map.reset(dynamic_cast<octomap::OcTree*>(tree));
          if (!m_map) {
            delete tree;
            RCLCPP_ERROR(nh->get_logger(), "Could not cast to OcTree");
          }
        }
      }
    } catch (const std::exception& e) {
      RCLCPP_ERROR(nh->get_logger(), "Exception while reading octree: %s", e.what());
      if (tree) {
        delete tree;
        tree = nullptr;
      }
    }
  } else {
    RCLCPP_ERROR(nh->get_logger(), "Failed to call service %s", servname.c_str());
  }

  if (!m_map || m_map->size() <= 1) {
    RCLCPP_ERROR(nh->get_logger(), "Occupancy map is erroneous, exiting...");
    exit(-1);
  }
  double x, y, z;
  m_map->getMetricSize(x, y, z);
  RCLCPP_INFO(nh->get_logger(), "Occupancy map initialized with %zd nodes (%.2f x %.2f x %.2f m), %f m res.", m_map->size(), x, y, z, m_map->getResolution());
  m_map->writeBinary("/tmp/octomap_loc");
}

OccupancyMap::~OccupancyMap() {}

bool OccupancyMap::isOccupied(octomap::OcTreeNode* node) const {
  return m_map->isNodeOccupied(node);
}

double OccupancyMap::getFloorHeight(const tf2::Transform& pose) const {
  // Convert geometry_msgs::msg::Pose to octomap::point3d
  octomap::point3d position(
    pose.getOrigin().getX(),
    pose.getOrigin().getY(),
    pose.getOrigin().getZ()
  );
  
  octomap::point3d end;
  if (m_map->castRay(position, octomap::point3d(0.0, 0.0, -1.0), end, false)) {
    return end.z() + m_map->getResolution() / 2.0;
  } else {
    RCLCPP_WARN(nh->get_logger(), "getFloorHeight raycast did not succeed, using 0.0");
    return 0.0;
  }
}

}

