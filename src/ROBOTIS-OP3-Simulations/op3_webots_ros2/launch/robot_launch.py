import os
import launch
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, ExecuteProcess # Import ExecuteProcess
from launch_ros.actions import Node
from ament_index_python.packages import get_package_share_directory

# from webots_ros2_driver.webots_launcher import WebotsLauncher # No longer needed

def generate_launch_description():

    ld = LaunchDescription()

    package_dir = get_package_share_directory('op3_webots_ros2')
    gain_file_path_default = package_dir + '/resource/op3_pid_gain_default.yaml'

    # Define the path to your Webots executable in WSL
    # VERIFY THIS PATH - it should be inside /usr/local/webots/
    webots_executable_path = '/usr/local/webots/webots'

    # Define the path to the Webots world file for the OP3
    webots_world_path = os.path.join(package_dir, 'worlds', 'robotis_op3_extern.wbt')

    # Use ExecuteProcess to launch Webots directly
    webots = ExecuteProcess(
        cmd=[webots_executable_path, webots_world_path],
        output='screen',
        # Add this event handler so that closing Webots stops the launch file
        on_exit=launch.actions.EmitEvent(event=launch.events.Shutdown()),
    )

    # This Node launches the external controller for the OP3 that communicates with Webots
    op3_controller_node = Node(
        package='op3_webots_ros2',
        executable='op3_extern_controller',
        output='screen',
        parameters=[{'gain_file_path': gain_file_path_default}]
    )

    # Add the actions to the launch description
    ld.add_action(webots)
    ld.add_action(op3_controller_node)

    return ld
