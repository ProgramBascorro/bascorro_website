#!/usr/bin/env python3
# filepath: /home/farhan/motion_webots/src/ROBOTIS-OP3-Tools/op3_action_editor/scripts/webots_executor.py

import subprocess
import rclpy
import time
import os
import shutil
from rclpy.node import Node
from ament_index_python.packages import get_package_share_directory

class ActionEditorExecutor(Node):
    def __init__(self):
        super().__init__('op3_action_editor_executor')
        self.get_logger().info('Starting Action Editor with Webots simulation')

def main(args=None):
    rclpy.init(args=args)
    node = ActionEditorExecutor()
    
    # Check terminal size
    columns, rows = shutil.get_terminal_size()
    print(f"Current terminal size: {columns}x{rows}")
    
    if columns != 80 or rows != 24:
        print("\nWARNING: Action Editor requires terminal size of 80x24")
        print("Your terminal size is currently", columns, "x", rows)
        print("\nResizing terminal. Please run:")
        print("stty cols 80 rows 24")
        print("Then run this script again.")
        print("\nAlternatively, you can resize your terminal manually.")
        
        # Optional auto-resize (may not work in all terminals)
        try:
            print("\nAttempting to automatically resize terminal...")
            os.system("stty cols 80 rows 24")
            print("Terminal resized. If the interface still looks wrong, resize manually.")
        except:
            pass

    # Check if Webots is running
    ps_output = subprocess.getoutput('ps aux | grep -i webots | grep -v grep')
    if not ps_output:
        print("WARNING: Webots does not appear to be running. Start Webots first!")
    
    # Define your package and executable
    package = "op3_action_editor"
    executable = "op3_action_editor"

    # For webots simulation, need to set gazebo to true
    webots_simulation = True
    robot_name_default = 'robotis_op3'

    offset_file_path_default = get_package_share_directory('op3_manager') + '/config/offset.yaml'
    robot_file_path_default = get_package_share_directory('op3_manager') + '/config/OP3.robot'
    init_file_path_default = get_package_share_directory('op3_manager') + '/config/dxl_init_OP3.yaml'
    action_file_path_default = get_package_share_directory('op3_action_module') + '/data/motion_4095.bin'
    device_name_default = '/dev/null'

    # Define any parameters or arguments
    params = [
        '--ros-args',
        '-p', f'gazebo:={webots_simulation}',
        '-p', f'gazebo_robot_name:={robot_name_default}',
        '-p', f'offset_file_path:={offset_file_path_default}',
        '-p', f'robot_file_path:={robot_file_path_default}',
        '-p', f'init_file_path:={init_file_path_default}',
        '-p', f'action_file_path:={action_file_path_default}',
        '-p', f'device_name:={device_name_default}'
    ]

    # Start OpenCR simulator for IMU/sensors
    print("Starting OpenCR simulator with dummy sensor data...")
    open_cr_proc = None
    try:
        open_cr_proc = subprocess.Popen(
            ['ros2', 'launch', 'open_cr_module', 'open_cr.launch.py', 
             'use_dummy_data:=true'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        time.sleep(2)
        print("OpenCR simulator started successfully")
    except Exception as e:
        print(f"ERROR: Failed to start OpenCR simulator: {e}")

    # Start audio player
    try:
        print("Starting audio player...")
        proc_player = subprocess.Popen(['ros2', 'run', 'ros_mpg321_player', 'ros_mpg321_player'],
                      stdout=subprocess.DEVNULL,
                      stderr=subprocess.DEVNULL
        )
        print("Audio player started")
    except Exception as e:
        print(f"Failed to run ros_mpg321_player: {e}")
        if open_cr_proc:
            open_cr_proc.kill()
        return 1

    # Start action editor - PENTING: gunakan stdin=None untuk pass keyboard input
    try:
        print("\nStarting action editor in Webots simulation mode...")
        proc_editor = subprocess.Popen(
            ['ros2', 'run', package, executable] + params,
            stdin=None,  # Penting agar input keyboard sampai ke action editor
            stdout=None,
            stderr=None
        )
        print("Action editor started - UI should appear now")
        print("If prompted to press any key, please do so in the action editor window")
    except Exception as e:
        print(f"Error while running op3_action_editor: {e}")
        proc_player.kill()
        if open_cr_proc:
            open_cr_proc.kill()
        return 1

    print("\nProcesses running. Keep this terminal open.")
    print("Press Ctrl+C to exit when finished.")

    try:
        while True:
            if proc_player.poll() is not None:
                print("Audio player has terminated")
                
            if proc_editor.poll() is not None:
                print(f"Action editor has terminated (code: {proc_editor.poll()})")
                break
            
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down by user request (Ctrl+C)")
    finally:
        print("Cleaning up processes...")
        if proc_player and proc_player.poll() is None:
            proc_player.terminate()
        if proc_editor and proc_editor.poll() is None:
            proc_editor.terminate()
        if open_cr_proc and open_cr_proc.poll() is None:
            open_cr_proc.terminate()

    rclpy.shutdown()
    print("Action editor session terminated.")
    return 0

if __name__ == '__main__':
    main()