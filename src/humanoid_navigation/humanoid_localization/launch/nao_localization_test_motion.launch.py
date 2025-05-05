from launch import LaunchDescription
from launch_ros.actions import Node
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.substitutions import FindPackageShare
from launch.actions import DeclareLaunchArgument
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    # Get package paths
    humanoid_localization_pkg = get_package_share_directory('humanoid_localization')
    
    # Path to the config file
    config_file = os.path.join(
        humanoid_localization_pkg,
        'config',
        'localization_conf_motion_test.yaml'
    )
    
    # Path to the map file
    map_file = os.path.join(
        humanoid_localization_pkg,
        'maps',
        'map.bt'
    )
    
    return LaunchDescription([
        # Use the octomap_server_ros package if available, otherwise use octomap_server
        Node(
            package='octomap_server'  # This may need to be adjusted based on ROS 2 package name
            executable='octomap_server',  # The executable name may differ in ROS 2
            name='octomap_server',
            parameters=[{'filename': map_file}]  # Different way to specify the map file
        ),
        
        # Updated localization node
        Node(
            package='nao_localization',  # Updated from nao_localization to humanoid_localization
            executable='nao_localization',   # Updated executable name
            name='nao_localization',     # Updated node name
            output='screen',
            parameters=[config_file]
        )
    ])