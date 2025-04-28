cmake_minimum_required(VERSION 3.5)
project(bascorro_demo)

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(std_msgs REQUIRED)
find_package(sensor_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(robotis_controller_msgs REQUIRED)
find_package(op3_walking_module_msgs REQUIRED)
find_package(op3_action_module_msgs REQUIRED)
find_package(robotis_math REQUIRED)
find_package(op3_ball_detector REQUIRED)
find_package(Boost REQUIRED COMPONENTS system thread)
find_package(Eigen3 REQUIRED)
find_package(yaml_cpp_vendor REQUIRED)

if(NOT ${YAML_CPP_VERSION} VERSION_LESS "0.5")
  add_definitions(-DHAVE_NEW_YAMLCPP)
endif()

ament_package(
  INCLUDE_DIRS include
  LIBRARIES bascorro_demo
  DEPENDS Boost Eigen3 yaml_cpp_vendor
)

include_directories(
  include
  ${rclcpp_INCLUDE_DIRS}
  ${std_msgs_INCLUDE_DIRS}
  ${sensor_msgs_INCLUDE_DIRS}
  ${geometry_msgs_INCLUDE_DIRS}
  ${robotis_controller_msgs_INCLUDE_DIRS}
  ${op3_walking_module_msgs_INCLUDE_DIRS}
  ${op3_action_module_msgs_INCLUDE_DIRS}
  ${robotis_math_INCLUDE_DIRS}
  ${op3_ball_detector_INCLUDE_DIRS}
  ${Boost_INCLUDE_DIRS}
  ${EIGEN3_INCLUDE_DIRS}
  ${yaml_cpp_vendor_INCLUDE_DIRS}
)

add_executable(${PROJECT_NAME}_node 
  src/demo_node.cpp
  src/soccer_demo.cpp
  src/ball_tracker.cpp
  src/ball_follower.cpp
)

ament_target_dependencies(${PROJECT_NAME}_node
  rclcpp
  std_msgs
  sensor_msgs
  geometry_msgs
  robotis_controller_msgs
  op3_walking_module_msgs
  op3_action_module_msgs
  robotis_math
  op3_ball_detector
  Boost
  Eigen3
  yaml_cpp_vendor
)

install(TARGETS ${PROJECT_NAME}_node
  DESTINATION lib/${PROJECT_NAME}
)

install(DIRECTORY include/${PROJECT_NAME}/
  DESTINATION include/${PROJECT_NAME}
  FILES_MATCHING PATTERN "*.hpp"
  PATTERN ".svn" EXCLUDE
)

install(DIRECTORY data launch list 
  DESTINATION share/${PROJECT_NAME}
)