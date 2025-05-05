#include <rclcpp/rclcpp.hpp>
#include <humanoid_localization/HumanoidLocalization.h>
#include <humanoid_localization/octomap_utils.h>
#include <chrono>

int main(int argc, char** argv){
  rclcpp::init(argc, argv);

  auto node = std::make_shared<rclcpp::Node>("humanoid_localization");
  unsigned seed;
  int iseed;
  node->declare_parameter<int>("seed", -1);
  node->get_parameter("seed", iseed);
  if(iseed == -1)
    seed = static_cast<unsigned int>(std::chrono::system_clock::now().time_since_epoch().count());
  else
    seed = static_cast<unsigned int>(iseed);

  humanoid_localization::HumanoidLocalization localization(seed);

  rclcpp::spin(node);
  rclcpp::shutdown();

  return 0;
}
