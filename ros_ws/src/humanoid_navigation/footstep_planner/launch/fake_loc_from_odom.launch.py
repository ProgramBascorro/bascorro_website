
from launch import LaunchDescription
from launch_ros.actions import Node

def generate_launch_description():
    return LaunchDescription([
        Node(
            package='fake_localization',
            executable='fake_localization',
            name='fake_localization',
            remappings=[
                ('base_pose_ground_truth', 'odom'),
                ('initialpose', 'nao_corrected_initialpose')
            ],
            parameters=[{
                'base_frame_id': 'torso',
                'delta_x': 0.0,
                'delta_y': 0.0,
                'delta_yaw': 0.0
            }]
        ),
        Node(
            package='footstep_planner',
            executable='corrected_initialpose.py',
            name='corrected_initialpose'
        )
    ])