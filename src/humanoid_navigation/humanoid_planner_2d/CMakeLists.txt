cmake_minimum_required(VERSION 3.8)
project(humanoid_planner_2d)

# Find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(visualization_msgs REQUIRED)
find_package(nav_msgs REQUIRED)
find_package(gridmap_2d REQUIRED)
find_package(OpenCV REQUIRED)

# First try to find SBPL in the workspace
find_package(sbpl QUIET)

# If sbpl package is found, use its paths
if(sbpl_FOUND)
  message(STATUS "SBPL found via find_package")
  message(STATUS "SBPL include dirs: ${sbpl_INCLUDE_DIRS}")
  message(STATUS "SBPL libraries: ${sbpl_LIBRARIES}")
else()
  # Check if we can find the local install
  set(WORKSPACE_SBPL_LIB "${CMAKE_INSTALL_PREFIX}/../sbpl/lib/libsbpl.so")
  
  if(EXISTS "${WORKSPACE_SBPL_LIB}")
    message(STATUS "Found SBPL in workspace: ${WORKSPACE_SBPL_LIB}")
    set(SBPL_LIBRARIES "${WORKSPACE_SBPL_LIB}")
    set(SBPL_INCLUDE_DIRS "${CMAKE_INSTALL_PREFIX}/../sbpl/include")
  else()
    # Fall back to system paths
    set(SBPL_INCLUDE_DIRS "/usr/local/include")
    set(SBPL_LIBRARIES "/usr/local/lib/libsbpl.so")
    
    if(NOT EXISTS "${SBPL_LIBRARIES}")
      message(FATAL_ERROR "SBPL library not found at ${SBPL_LIBRARIES}. Please install SBPL or fix the path.")
    endif()
    message(STATUS "Using system SBPL: ${SBPL_LIBRARIES}")
  endif()
endif()

include_directories(include ${SBPL_INCLUDE_DIRS} ${gridmap_2d_INCLUDE_DIRS})

# Add library
add_library(${PROJECT_NAME} SHARED src/SBPLPlanner2D.cpp)
ament_target_dependencies(${PROJECT_NAME} rclcpp geometry_msgs visualization_msgs nav_msgs gridmap_2d OpenCV)
target_include_directories(${PROJECT_NAME} PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>
  ${SBPL_INCLUDE_DIRS}
  ${gridmap_2d_INCLUDE_DIRS}
)
target_link_libraries(${PROJECT_NAME} ${SBPL_LIBRARIES} ${gridmap_2d_LIBRARIES})

# Add executable
add_executable(sbpl_2d_planner_node src/humanoid_planner_2d.cpp)
ament_target_dependencies(sbpl_2d_planner_node rclcpp geometry_msgs visualization_msgs nav_msgs gridmap_2d OpenCV)
target_include_directories(sbpl_2d_planner_node PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>
  ${SBPL_INCLUDE_DIRS}
  ${gridmap_2d_INCLUDE_DIRS}
)
target_link_libraries(sbpl_2d_planner_node ${PROJECT_NAME} ${SBPL_LIBRARIES} ${gridmap_2d_LIBRARIES})

# Install targets
install(TARGETS ${PROJECT_NAME}
  EXPORT export_${PROJECT_NAME}  # Add this line
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION lib/${PROJECT_NAME}
)
install(TARGETS sbpl_2d_planner_node
  DESTINATION lib/${PROJECT_NAME}
)

# Install include directories
install(DIRECTORY include/${PROJECT_NAME}/
  DESTINATION include/${PROJECT_NAME}
  FILES_MATCHING PATTERN "*.h"
)

ament_export_targets(export_${PROJECT_NAME} HAS_LIBRARY_TARGET)
ament_export_include_directories(include)
ament_export_libraries(${PROJECT_NAME})
ament_export_dependencies(rclcpp geometry_msgs visualization_msgs nav_msgs gridmap_2d)

ament_package()