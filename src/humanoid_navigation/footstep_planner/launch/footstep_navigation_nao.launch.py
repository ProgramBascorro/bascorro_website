
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.parameter_descriptions import ParameterFile
from launch_ros.substitutions import FindPackageShare

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='footstep_planner',
            executable='footstep_navigation_node',
            name='footstep_navigation',
            parameters=[
                ParameterFile(LaunchConfiguration('planning_params'), allow_substs=True),
                ParameterFile(LaunchConfiguration('navigation_params'), allow_substs=True),
                ParameterFile(LaunchConfiguration('planning_params_nao'), allow_substs=True),
                ParameterFile(LaunchConfiguration('footsteps_nao_navigation'), allow_substs=True)
            ]
        ),
        DeclareLaunchArgument(
            'planning_params',
            default_value=[PathJoinSubstitution([FindPackageShare('footstep_planner'), 'config', 'planning_params.yaml'])],
            description='Path to the planning parameters file'
        ),
        DeclareLaunchArgument(
            'navigation_params',
            default_value=[PathJoinSubstitution([FindPackageShare('footstep_planner'), 'config', 'navigation_params.yaml'])],
            description='Path to the navigation parameters file'
        ),
        DeclareLaunchArgument(
            'planning_params_nao',
            default_value=[PathJoinSubstitution([FindPackageShare('footstep_planner'), 'config', 'planning_params_nao.yaml'])],
            description='Path to the planning parameters for NAO file'
        ),
        DeclareLaunchArgument(
            'footsteps_nao_navigation',
            default_value=[PathJoinSubstitution([FindPackageShare('footstep_planner'), 'config', 'footsteps_nao_navigation.yaml'])],
            description='Path to the footsteps NAO navigation parameters file'
        )
    ])