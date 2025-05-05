
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch_ros.parameter_descriptions import ParameterValue
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
        Node(
            package='rclcpp',
            executable='parameter_bridge',
            name='parameter_bridge',
            parameters=[{
                'footstep_planner/heuristic_type': 'EuclideanHeuristic',
                'footstep_planner/planner_type': 'RSTARPlanner',
                'footstep_planner/forward_search': True,
                'footstep_planner/allocated_time': 5,
                'footstep_planner/initial_epsilon': 10,
                'footstep_planner/num_random_nodes': 20,
                'footstep_planner/random_node_dist': 1.5,
            }]
        )
    ])