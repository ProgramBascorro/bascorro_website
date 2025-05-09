cmake_minimum_required(VERSION 3.5)
project(footstep_planner)

# Tambahkan baris ini untuk build tipe Debug
# Ini akan mengaktifkan flag seperti -g
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Debug)
endif()

# Atau, Anda bisa memaksa Debug:
# set(CMAKE_BUILD_TYPE Debug)

# Anda juga bisa menambahkan flag compiler secara eksplisit jika perlu,
# meskipun CMAKE_BUILD_TYPE Debug biasanya sudah cukup.
add_compile_options(-g -Wall -Wextra) # -Wall dan -Wextra untuk warning tambahan


list(APPEND CMAKE_PREFIX_PATH "${CMAKE_INSTALL_PREFIX}/../humanoid_nav_msgs")
set(humanoid_nav_msgs_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../../install/humanoid_nav_msgs/share/humanoid_nav_msgs/cmake")

# Find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclpy REQUIRED)
find_package(rclcpp_action REQUIRED)
find_package(action_msgs REQUIRED)
find_package(angles REQUIRED)
find_package(nav_msgs REQUIRED)
find_package(tf2_ros REQUIRED)
find_package(tf2_geometry_msgs REQUIRED)
find_package(visualization_msgs REQUIRED)
find_package(humanoid_nav_msgs REQUIRED)
find_package(OpenCV REQUIRED)
find_package(gridmap_2d REQUIRED) #Penambahan baru
message(STATUS "gridmap_2d libraries: ${gridmap_2d_LIBRARIES}")
message(STATUS "gridmap_2d include dirs: ${gridmap_2d_INCLUDE_DIRS}")
message(STATUS "gridmap_2d version: ${gridmap_2d_VERSION}")
message(STATUS "gridmap_2d found: ${gridmap_2d_FOUND}")
find_package(sbpl REQUIRED) #Penambahan baru

# Add your source files here
set(FOOTSTEP_PLANNER_FILES src/FootstepPlanner.cpp
  src/FootstepNavigation.cpp
  src/FootstepPlannerNode.cpp
  src/FootstepPlannerEnvironment.cpp 
  src/Footstep.cpp
  src/PlanningState.cpp
  src/Heuristic.cpp 
  src/helper.cpp
  src/PathCostHeuristic.cpp
  src/PlanningStateChangeQuery.cpp
  src/State.cpp
)

add_library(xmlrpc_compatibility INTERFACE)
target_include_directories(xmlrpc_compatibility INTERFACE
  ${CMAKE_CURRENT_SOURCE_DIR}/include
)

include_directories(
  include
  ${CMAKE_CURRENT_SOURCE_DIR}/include
  ${rclcpp_INCLUDE_DIRS}
  ${angles_INCLUDE_DIRS}
  ${gridmap_2d_INCLUDE_DIRS}
  ${SBPL_INCLUDE_DIRS}
  # ${CMAKE_SOURCE_DIR}/geometry2/tf2_geometry_msgs/include/tf2_geometry_msgs
)



add_library(${PROJECT_NAME} SHARED ${FOOTSTEP_PLANNER_FILES})
ament_target_dependencies(${PROJECT_NAME} rclcpp rclpy rclcpp_action action_msgs std_msgs sensor_msgs geometry_msgs nav_msgs tf2_geometry_msgs tf2 tf2_ros OpenCV humanoid_nav_msgs angles sbpl visualization_msgs)
target_link_libraries(${PROJECT_NAME} xmlrpc_compatibility ${gridmap_2d_LIBRARIES} ${SBPL_LIBRARIES})

add_executable(footstep_planner_node src/footstep_planner.cpp)
ament_target_dependencies(footstep_planner_node rclcpp rclpy rclcpp_action action_msgs std_msgs sensor_msgs geometry_msgs nav_msgs tf2_geometry_msgs tf2 tf2_ros OpenCV humanoid_nav_msgs angles sbpl visualization_msgs)
target_link_libraries(footstep_planner_node ${PROJECT_NAME} xmlrpc_compatibility ${gridmap_2d_LIBRARIES} ${SBPL_LIBRARIES})

add_executable(footstep_planner_walls src/footstep_planner_walls.cpp)
ament_target_dependencies(footstep_planner_walls rclcpp rclpy rclcpp_action action_msgs std_msgs sensor_msgs geometry_msgs nav_msgs tf2 tf2_ros OpenCV humanoid_nav_msgs angles sbpl visualization_msgs)
target_link_libraries(footstep_planner_walls ${PROJECT_NAME} ${OpenCV_LIBS} xmlrpc_compatibility ${gridmap_2d_LIBRARIES} ${SBPL_LIBRARIES})

add_executable(footstep_navigation_node src/footstep_navigation.cpp)
ament_target_dependencies(footstep_navigation_node rclcpp rclpy rclcpp_action action_msgs std_msgs sensor_msgs geometry_msgs nav_msgs tf2 tf2_ros OpenCV humanoid_nav_msgs angles sbpl visualization_msgs)
target_link_libraries(footstep_navigation_node ${PROJECT_NAME} xmlrpc_compatibility ${tf2_geometry_msgs_LIBRARIES} ${gridmap_2d_LIBRARIES} ${SBPL_LIBRARIES})

# Instalasi Library
install(TARGETS ${PROJECT_NAME}
  LIBRARY DESTINATION lib  # Akan ke install/footstep_planner/lib/libfootstep_planner.so
  ARCHIVE DESTINATION lib  # Untuk file .a jika ada (biasanya tidak untuk SHARED di Linux)
)

install(TARGETS footstep_planner_node footstep_planner_walls footstep_navigation_node
  DESTINATION lib/${PROJECT_NAME}
)
install(DIRECTORY include/${PROJECT_NAME}/
  DESTINATION include/${PROJECT_NAME}
  FILES_MATCHING PATTERN "*.h"
)
install(FILES 
  include/footstep_planner/XmlRpcValue.h
  include/footstep_planner/XmlRpcException.h
  include/footstep_planner/XmlRpc.h
  DESTINATION include/footstep_planner/
)

ament_package()