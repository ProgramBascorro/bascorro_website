from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch_ros.actions import Node
from launch.launch_description_sources import PythonLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    # Define paths
    op3_manager_path = get_package_share_directory('op3_manager')
    op3_ball_detector_path = get_package_share_directory('op3_ball_detector')
    op3_demo_path = get_package_share_directory('op3_demo')
    op3_camera_setting_tool_path = get_package_share_directory('op3_camera_setting_tool')
    op3_web_setting_tool_path = get_package_share_directory('op3_web_setting_tool')

    return LaunchDescription([
        # Include robotis op3 manager
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([os.path.join(op3_manager_path, 'launch', 'op3_manager.launch.py')])
        ),

        # Include Camera and Ball detector
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([os.path.join(op3_ball_detector_path, 'launch', 'ball_detector_from_usb_cam.launch.py')])
        ),

        # Include face tracking (commented out)
        # IncludeLaunchDescription(
        #     PythonLaunchDescriptionSource([os.path.join(op3_demo_path, 'launch', 'face_detection_op3.launch.py')])
        # ),

        # Include camera setting tool
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource([os.path.join(op3_camera_setting_tool_path, 'launch', 'op3_camera_setting_tool.launch.py')])
        ),

        # Include sound player (commented out)
        # Node(
        #     package='ros_madplay_player',
        #     executable='ros_madplay_player',
        #     name='ros_madplay_player',
        #     output='screen'
        # ),

        # Include web setting (commented out)
        # IncludeLaunchDescription(
        #     PythonLaunchDescriptionSource([os.path.join(op3_web_setting_tool_path, 'launch', 'web_setting_server.launch.py')])
        # ),

        # Node for robotis soccer demo
        Node(
            package='bascorro_demo',
            executable='bascorro_soccer_node',
            name='soccer_demo',
            output='screen',
            parameters=[
                {'grass_demo': False},
                {'p_gain': 0.45},
                {'d_gain': 0.045}
            ]
        )
    ])