
from launch import LaunchDescription
from launch_ros.actions import Node
from ament_index_python.packages import FindPackageShare

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='rviz2',
            executable='rviz2',
            name='rviz',
            arguments=['-d', [FindPackageShare('footstep_planner'), '/config/rviz_footstep_navigation.vcg']],
            output='screen'
        )
    ])