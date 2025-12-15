from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument, LogInfo, OpaqueFunction
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.substitutions import FindPackageShare
from ament_index_python.packages import get_package_share_directory
import os

def check_file_exists(context, *args, **kwargs):
    config_file = LaunchConfiguration('config_file').perform(context)
    if not os.path.exists(config_file):
        return [LogInfo(msg=f"Warning: Config file {config_file} does not exist!")]
    return []

def generate_launch_description():
    pkg_share = get_package_share_directory('humanoid_localization')
    default_config_path = os.path.join(pkg_share, 'config', 'nao_localization_laser.yaml')
    
    return LaunchDescription([
        DeclareLaunchArgument(
            'config_file',
            default_value=default_config_path,
            description='Path to the configuration file'
        ),
        
        OpaqueFunction(function=check_file_exists),
        
        Node(
            package='humanoid_localization',
            executable='localization_node',
            name='humanoid_localization',
            output='screen',
            parameters=[LaunchConfiguration('config_file')]
        )
    ])