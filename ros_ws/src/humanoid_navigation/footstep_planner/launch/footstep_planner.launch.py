
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.parameter_descriptions import ParameterValue

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='footstep_planner',
            executable='footstep_planner_node',
            name='footstep_planner',
            parameters=[
                ParameterValue(LaunchConfiguration('planning_params'), value_type=str),
                ParameterValue(LaunchConfiguration('planning_params_asimo'), value_type=str),
                ParameterValue(LaunchConfiguration('footsteps_asimo'), value_type=str)
            ]
        ),
        DeclareLaunchArgument(
            'planning_params',
            default_value=[('$(find footstep_planner)/config/planning_params.yaml')],
            description='Path to the planning parameters YAML file'
        ),
        DeclareLaunchArgument(
            'planning_params_asimo',
            default_value=[('$(find footstep_planner)/config/planning_params_asimo.yaml')],
            description='Path to the ASIMO planning parameters YAML file'
        ),
        DeclareLaunchArgument(
            'footsteps_asimo',
            default_value=[('$(find footstep_planner)/config/footsteps_asimo.yaml')],
            description='Path to the ASIMO footsteps YAML file'
        )
    ])