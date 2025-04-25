# --- Keep these imports ---
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Imu
from std_msgs.msg import Float64
from geometry_msgs.msg import Quaternion
import time
import math
import numpy as np
import yaml # For loading YAML files
import os  # For path manipulation
from ament_index_python.packages import get_package_share_directory
from scipy.spatial.transform import Rotation as R # Use scipy

# --- Define Joint Mapping ---
YAML_TO_ROS_JOINT_MAP = {
    "R_SHOULDER_PITCH": "r_sho_pitch",
    "L_SHOULDER_PITCH": "l_sho_pitch",
    "R_SHOULDER_ROLL": "r_sho_roll",
    "L_SHOULDER_ROLL": "l_sho_roll",
    "R_ELBOW": "r_el",
    "L_ELBOW": "l_el",
    "R_HIP_YAW": "r_hip_yaw",
    "L_HIP_YAW": "l_hip_yaw",
    "R_HIP_ROLL": "r_hip_roll",
    "L_HIP_ROLL": "l_hip_roll",
    "R_HIP_PITCH": "r_hip_pitch",
    "L_HIP_PITCH": "l_hip_pitch",
    "R_KNEE": "r_knee",
    "L_KNEE": "l_knee",
    "R_ANKLE_PITCH": "r_ank_pitch",
    "L_ANKLE_PITCH": "l_ank_pitch",
    "R_ANKLE_ROLL": "r_ank_roll",
    "L_ANKLE_ROLL": "l_ank_roll",
    # "NECK": "head_pan", # Add if needed
    # "HEAD": "head_tilt" # Add if needed
}

# --- Keep DEFAULT_SCRIPT_MAPPING ---
DEFAULT_SCRIPT_MAPPING = {
    "UPRIGHT": ["Stand.yaml"],
    "FRONT": ["StandUpFront.yaml", "Stand.yaml"],
    "BACK": ["StandUpBack.yaml", "Stand.yaml"],
    "LEFT": ["StandUpFront.yaml", "Stand.yaml"], # Using front for sides based on NUbots
    "RIGHT": ["StandUpFront.yaml", "Stand.yaml"], # Using front for sides based on NUbots
    "UPSIDE_DOWN": ["Relax.yaml"],
    "UNKNOWN": ["StandUpBack.yaml", "Stand.yaml"] # Fallback
}

# --- Keep OP3_CONTROLLED_JOINTS list ---
OP3_CONTROLLED_JOINTS = [
    "r_sho_pitch", "l_sho_pitch", "r_sho_roll", "l_sho_roll", "r_el", "l_el",
    "r_hip_yaw", "l_hip_yaw", "r_hip_roll", "l_hip_roll",
    "r_hip_pitch", "l_hip_pitch", "r_knee", "l_knee",
    "r_ank_pitch", "l_ank_pitch", "r_ank_roll", "l_ank_roll",
    "head_pan", "head_tilt"
]

class GetUpNode(Node):
    def __init__(self):
        super().__init__('op3_get_up_node')
        # ... (Keep parameters, state vars, publishers, subscriber, timer setup as before) ...
        # Parameters
        self.declare_parameter('imu_topic', '/robotis_op3/imu')
        self.declare_parameter('update_rate_hz', 10.0)
        self.declare_parameter('motion_script_dir', 'motion_scripts')

        imu_topic = self.get_parameter('imu_topic').get_parameter_value().string_value
        update_rate = self.get_parameter('update_rate_hz').get_parameter_value().double_value
        motion_script_subdir = self.get_parameter('motion_script_dir').get_parameter_value().string_value

        pkg_share_path = get_package_share_directory('op3_get_up_behavior')
        self.motion_script_path = os.path.join(pkg_share_path, motion_script_subdir)
        self.get_logger().info(f"Looking for motion YAML files in: {self.motion_script_path}")

        self.loaded_sequences = self.load_all_sequences(DEFAULT_SCRIPT_MAPPING)
        if not self.loaded_sequences:
             self.get_logger().error("Failed to load any motion sequences. Shutting down.")
             raise RuntimeError("Failed to load motion sequences")

        # State variables
        self.current_orientation_quat = None
        self.current_orientation_scipy = None
        self.fall_direction = "UNKNOWN"
        self.is_getting_up = False
        self.active_sequence_name = None
        self.active_sub_script_index = -1
        self.current_script_steps = []
        self.motion_step_index = -1
        self.motion_step_start_time = 0.0

        # Publishers
        self.joint_publishers = {}
        for joint_name in OP3_CONTROLLED_JOINTS:
            topic_name = f'/robotis_op3/{joint_name}_position/command'
            self.joint_publishers[joint_name] = self.create_publisher(Float64, topic_name, 10)

        # Subscriber
        self.imu_sub = self.create_subscription(
            Imu,
            imu_topic,
            self.imu_callback,
            10)

        # Timer
        self.timer = self.create_timer(1.0 / update_rate, self.timer_callback)

        self.get_logger().info("Get Up Behavior Node started (YAML Script Logic).")


    # ============================================
    # === REVISED load_motion_script Function ===
    # ============================================
    def load_motion_script(self, filename):
        """Loads a single motion script YAML file with the new structure."""
        full_path = os.path.join(self.motion_script_path, filename)
        self.get_logger().debug(f"Attempting to load script: {full_path}")
        try:
            with open(full_path, 'r') as f:
                # Load the entire YAML document
                script_data = yaml.safe_load(f)

                # --- Validate Structure ---
                if not isinstance(script_data, list):
                    self.get_logger().error(f"Invalid format in {filename}: Top level is not a LIST.")
                    return None

                parsed_steps = []
                # Iterate through each step (which is a dictionary) in the list
                for step_index, step in enumerate(script_data):
                    if not isinstance(step, dict):
                        self.get_logger().warn(f"Skipping step {step_index} in {filename}: Step is not a dictionary.")
                        continue
                    if 'duration' not in step or 'targets' not in step:
                        self.get_logger().warn(f"Skipping step {step_index} in {filename}: Missing 'duration' or 'targets' key.")
                        continue
                    if not isinstance(step['targets'], list):
                        self.get_logger().warn(f"Skipping step {step_index} in {filename}: 'targets' value is not a list.")
                        continue

                    # Convert duration from ms to seconds
                    try:
                        duration_sec = float(step['duration']) / 1000.0
                        if duration_sec <= 0:
                             self.get_logger().warn(f"Skipping step {step_index} in {filename}: Invalid duration {step['duration']}.")
                             continue
                    except (ValueError, TypeError):
                         self.get_logger().warn(f"Skipping step {step_index} in {filename}: Non-numeric duration '{step['duration']}'.")
                         continue


                    # --- Parse Targets ---
                    target_angles_for_step = {} # Angles for this specific step
                    valid_targets_found = False
                    for target in step['targets']:
                        if not isinstance(target, dict) or 'id' not in target or 'position' not in target:
                            self.get_logger().warn(f"Skipping invalid target in step {step_index} of {filename}: {target}")
                            continue

                        yaml_joint_id = target['id']
                        try:
                             target_position = float(target['position'])
                        except (ValueError, TypeError):
                             self.get_logger().warn(f"Skipping target '{yaml_joint_id}' in step {step_index} of {filename}: Non-numeric position '{target['position']}'.")
                             continue


                        # Map YAML ID to ROS joint name
                        ros_joint_name = YAML_TO_ROS_JOINT_MAP.get(yaml_joint_id)
                        if ros_joint_name:
                            if ros_joint_name in OP3_CONTROLLED_JOINTS:
                                target_angles_for_step[ros_joint_name] = target_position
                                valid_targets_found = True
                            else:
                                 self.get_logger().debug(f"Ignoring target '{yaml_joint_id}' in step {step_index} of {filename}: '{ros_joint_name}' not in OP3_CONTROLLED_JOINTS.")
                        else:
                            self.get_logger().warn(f"Skipping target '{yaml_joint_id}' in step {step_index} of {filename}: No mapping found in YAML_TO_ROS_JOINT_MAP.")

                    # Only add the step if it contained valid targets
                    if valid_targets_found:
                        parsed_steps.append({'duration': duration_sec, 'angles': target_angles_for_step})
                    else:
                         self.get_logger().warn(f"Skipping step {step_index} in {filename}: No valid/mapped targets found in step.")


                if not parsed_steps:
                     self.get_logger().warn(f"No valid steps parsed from {filename}.")
                     return None # Return None if no steps were useful

                self.get_logger().info(f"Successfully loaded {len(parsed_steps)} steps from {filename}")
                return parsed_steps

        except FileNotFoundError:
            self.get_logger().error(f"Motion script file not found: {full_path}")
            return None
        except yaml.YAMLError as e:
            self.get_logger().error(f"Error parsing YAML file {full_path}: {e}")
            return None
        except Exception as e:
            self.get_logger().error(f"Unexpected error loading script {full_path}: {e}", include_traceback=True)
            return None
    # ============================================
    # === END REVISED load_motion_script =======
    # ============================================


    # --- Keep load_all_sequences function (it should work with the revised load_motion_script) ---
    def load_all_sequences(self, script_mapping):
        """Loads all sequences defined in the mapping from direction to list of filenames."""
        loaded_data = {}
        all_successful = True
        for direction, filenames in script_mapping.items():
            combined_sequence = []
            sequence_successful = True
            for filename in filenames:
                steps = self.load_motion_script(filename)
                if steps:
                    combined_sequence.extend(steps)
                else:
                    self.get_logger().error(f"Failed to load script '{filename}' for direction '{direction}'. Sequence may be incomplete.")
                    sequence_successful = False
                    all_successful = False
                    # break # Optional: Stop processing this direction if one file fails

            if sequence_successful and combined_sequence:
                loaded_data[direction] = combined_sequence
            else:
                # Log error only if no steps loaded AT ALL for this direction
                if not combined_sequence:
                     self.get_logger().error(f"No valid steps loaded for direction '{direction}'.")

        if not all_successful:
             self.get_logger().warn("One or more motion scripts failed to load.")
        if not loaded_data:
             self.get_logger().error("CRITICAL: No motion sequences were loaded successfully!")
             return None

        return loaded_data

    # --- Keep imu_callback ---
    def imu_callback(self, msg: Imu):
        """Stores the latest orientation as a scipy Rotation object."""
        self.current_orientation_quat = msg.orientation
        try:
            q = self.current_orientation_quat
            self.current_orientation_scipy = R.from_quat([q.x, q.y, q.z, q.w])
        except Exception as e:
            self.get_logger().warn(f"Error creating Rotation object: {e}")
            self.current_orientation_scipy = None

    # --- Keep determine_fall_direction ---
    def determine_fall_direction(self) -> str:
        """Determines fall direction based on torso axes relative to world frame."""
        if self.current_orientation_scipy is None: return "UNKNOWN"
        try:
            robot_x=np.array([1.,0.,0.]); robot_y=np.array([0.,1.,0.]); robot_z=np.array([0.,0.,1.])
            wx = self.current_orientation_scipy.apply(robot_x); wy = self.current_orientation_scipy.apply(robot_y); wz = self.current_orientation_scipy.apply(robot_z)
            front = (wx[2] <= wx[0] and wx[2] <= wx[1]); back = (wx[2] >= wx[0] and wx[2] >= wx[1])
            right = (wy[2] >= wy[0] and wy[2] >= wy[1]); left = (wy[2] <= wy[0] and wy[2] <= wy[1])
            up = (wz[2] >= wz[0] and wz[2] >= wz[1]); down = (wz[2] <= wz[0] and wz[2] <= wz[1])
            if front: return "FRONT";
            if back: return "BACK";
            if left: return "LEFT";
            if right: return "RIGHT";
            if down: return "UPSIDE_DOWN";
            if up: return "UPRIGHT";
            return "UNKNOWN"
        except Exception as e: self.get_logger().error(f"Error determining fall direction: {e}"); return "UNKNOWN"

    # --- Keep timer_callback ---
    def timer_callback(self):
        """Main loop: checks state and triggers/executes get up motion."""
        if self.current_orientation_scipy is None:
            self.get_logger().info("Waiting for IMU data...", throttle_duration_sec=5.0)
            return

        current_direction = self.determine_fall_direction()
        is_currently_fallen = current_direction not in ["UPRIGHT", "UNKNOWN"]

        if current_direction != "UNKNOWN" and current_direction != self.fall_direction:
            self.get_logger().info(f"Robot orientation detected as: {current_direction}")
            self.fall_direction = current_direction

        if not self.is_getting_up:
            if is_currently_fallen:
                self.active_sequence_name = current_direction
                sequence_to_run = self.loaded_sequences.get(self.active_sequence_name, self.loaded_sequences.get("UNKNOWN"))
                if sequence_to_run:
                    self.get_logger().info(f"Fall detected ({self.active_sequence_name}). Initiating sequence...")
                    self.is_getting_up = True
                    self.current_script_steps = sequence_to_run
                    self.motion_step_index = 0
                    self.motion_step_start_time = self.get_clock().now().nanoseconds / 1e9
                    self.publish_motion_step()
                else:
                    self.get_logger().error(f"No loaded sequence found for direction '{self.active_sequence_name}' or UNKNOWN fallback!")
        else: # Currently getting up
            current_time = self.get_clock().now().nanoseconds / 1e9
            if not self.current_script_steps or self.motion_step_index < 0 or self.motion_step_index >= len(self.current_script_steps):
                self.get_logger().warn("Invalid motion step index or script while getting up. Resetting.")
                self.reset_getup_state(); return

            step_duration = self.current_script_steps[self.motion_step_index]['duration']
            if current_time - self.motion_step_start_time >= step_duration:
                self.motion_step_index += 1
                if self.motion_step_index < len(self.current_script_steps):
                    self.get_logger().info(f"Executing get up step {self.motion_step_index + 1}/{len(self.current_script_steps)}")
                    self.motion_step_start_time = current_time
                    self.publish_motion_step()
                else:
                    self.get_logger().info(f"Get up sequence '{self.active_sequence_name}' finished.")
                    self.reset_getup_state()
                    final_direction = self.determine_fall_direction()
                    self.get_logger().info(f"Final state after getup: {final_direction}")

            if self.is_getting_up and not is_currently_fallen:
                 self.get_logger().info("Robot became upright during get up, stopping sequence.")
                 self.reset_getup_state()

    # --- Keep publish_motion_step ---
    def publish_motion_step(self):
        """Publishes the joint angles for the current motion step."""
        if not self.is_getting_up or not self.current_script_steps or self.motion_step_index < 0 or self.motion_step_index >= len(self.current_script_steps): return
        target_pose = self.current_script_steps[self.motion_step_index]['angles']
        self.publish_pose(target_pose)

    # --- Keep publish_pose ---
    def publish_pose(self, target_pose):
        """Publishes a dictionary of joint angles."""
        if not isinstance(target_pose, dict): self.get_logger().error(f"Target pose is not a dictionary: {target_pose}"); return
        for joint_name, target_angle in target_pose.items():
            if joint_name in self.joint_publishers:
                msg = Float64()
                if isinstance(target_angle, (int, float)):
                    msg.data = float(target_angle); self.joint_publishers[joint_name].publish(msg)
                else: self.get_logger().warn(f"Invalid angle type for {joint_name}: {type(target_angle)}", throttle_duration_sec=10.0)

    # --- Keep reset_getup_state ---
    def reset_getup_state(self):
        """Resets the state machine variables."""
        self.is_getting_up = False; self.active_sequence_name = None
        self.current_script_steps = []; self.motion_step_index = -1

# --- Keep main function ---
def main(args=None):
    rclpy.init(args=args); node = None
    try:
        node = GetUpNode()
        if node.loaded_sequences: rclpy.spin(node)
        else: print("GetUpNode failed to initialize properly due to loading errors.")
    except KeyboardInterrupt:
        if node: node.get_logger().info("Get Up Node interrupted. Shutting down.")
    except RuntimeError as e: print(f"GetUpNode initialization failed: {e}")
    except Exception as e:
        if node: node.get_logger().fatal(f"Unhandled exception in GetUpNode: {e}", include_traceback=True)
        else: print(f"Unhandled exception before GetUpNode creation: {e}")
    finally:
        if node and hasattr(node, 'destroy_node'): node.destroy_node()
        rclpy.try_shutdown()

if __name__ == '__main__':
    main()