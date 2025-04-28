from launch import LaunchDescription
from launch_ros.actions import Node
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    # Define paths
    op3_demo_path = get_package_share_directory('op3_demo')
    op3_manager_path = get_package_share_directory('op3_manager')
    op3_ball_detector_path = get_package_share_directory('op3_ball_detector')
    op3_camera_setting_tool_path = get_package_share_directory('op3_camera_setting_tool')
    op3_web_setting_tool_path = get_package_share_directory('op3_web_setting_tool')

    return LaunchDescription([
        # Uncomment and include other launch files as needed
        # IncludeLaunchDescription(
        #     PythonLaunchDescriptionSource([os.path.join(op3_manager_path, 'launch', 'op3_manager.launch.py')])
        # ),
        # IncludeLaunchDescription(
        #     PythonLaunchDescriptionSource([os.path.join(op3_ball_detector_path, 'launch', 'ball_detector_from_usb_cam.launch.py')])
        # ),
        # IncludeLaunchDescription(
        #     PythonLaunchDescriptionSource([os.path.join(op3_demo_path, 'launch', 'face_detection_op3.launch.py')])
        # ),
        # IncludeLaunchDescription(
        #     PythonLaunchDescriptionSource([os.path.join(op3_camera_setting_tool_path, 'launch', 'op3_camera_setting_tool.launch.py')])
        # ),
        # IncludeLaunchDescription(
        #     PythonLaunchDescriptionSource([os.path.join(op3_web_setting_tool_path, 'launch', 'web_setting_server.launch.py')])
        # ),

        # Node for ball tracker
        Node(
            package='op3_demo',
            executable='op_ball_tracker_node',
            name='op3_demo',
            output='screen',
            parameters=[
                {'grass_demo': False},
                {'p_gain': 0.45},
                {'d_gain': 0.045}
            ]
        )
    ])