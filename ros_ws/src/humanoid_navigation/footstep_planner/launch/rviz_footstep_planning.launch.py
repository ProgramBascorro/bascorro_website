
from launch import LaunchDescription
from launch_ros.actions import Node
from launch.substitutions import LaunchConfiguration
from launch_ros.substitutions import FindPackageShare
from launch_ros.substitutions import PathJoinSubstitution

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='rviz2',
            executable='rviz2',
            name='rviz',
            arguments=['-d', [LaunchConfiguration('config')]],
            parameters=[{'config': PathJoinSubstitution([FindPackageShare('footstep_planner'), 'config', 'rviz_footstep_planning.rviz'])}]
        )
    ])