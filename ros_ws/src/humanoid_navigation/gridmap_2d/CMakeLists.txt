cmake_minimum_required(VERSION 3.5)
project(gridmap_2d)

# Find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(nav_msgs REQUIRED)
find_package(OpenCV REQUIRED)

# Include directories
include_directories(include)

# Add library
add_library(${PROJECT_NAME} SHARED src/GridMap2D.cpp)

# Link dependencies
ament_target_dependencies(${PROJECT_NAME} rclcpp nav_msgs)
target_link_libraries(${PROJECT_NAME} ${OpenCV_LIBS})

# Install targets
install(TARGETS ${PROJECT_NAME}
  EXPORT ${PROJECT_NAME}
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION lib/${PROJECT_NAME}
)

# Install include directories
install(DIRECTORY include/
  DESTINATION include/
  FILES_MATCHING PATTERN "*.h"
)
ament_export_targets(${PROJECT_NAME} HAS_LIBRARY_TARGET)
ament_export_dependencies(rclcpp nav_msgs)
ament_export_include_directories(include)
ament_export_libraries(${PROJECT_NAME})

ament_package()