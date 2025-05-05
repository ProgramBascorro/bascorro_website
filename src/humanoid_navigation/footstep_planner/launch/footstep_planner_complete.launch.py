
from launch import LaunchDescription
from launch_ros.actions import Node, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    footstep_planner_dir = get_package_share_directory('footstep_planner')
    
    return LaunchDescription([
        Node(
            package='map_server',
            executable='map_server',
            name='map_server',
            arguments=[os.path.join(footstep_planner_dir, 'maps', 'sample.yaml')]
        ),
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(footstep_planner_dir, 'launch', 'rviz_footstep_planning.launch.py')
            )
        ),
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(footstep_planner_dir, 'launch', 'footstep_planner.launch.py')
            )
        ),
    ])