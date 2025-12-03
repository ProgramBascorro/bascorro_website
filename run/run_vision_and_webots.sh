#!/bin/bash

# Simple script that runs all commands in background and logs output
# Make sure to run: chmod +x run_all_simple.sh before executing

LOG_DIR="ros2_logs"
mkdir -p $LOG_DIR

# echo "Building workspace..."
# colcon build

echo "SKipping Build biar cepet :)"
source install/setup.bash

echo "Starting all ROS2 processes in background..."

# Run action editor
ros2 run op3_action_editor webots_executor.py > $LOG_DIR/action_editor.log 2>&1 &
ACTION_PID=$!
echo "Action Editor started (PID: $ACTION_PID)"

# Run rqt_image_view
ros2 run rqt_image_view rqt_image_view > $LOG_DIR/rqt_image_view.log 2>&1 &
RQT_PID=$!
echo "RQT Image View started (PID: $RQT_PID)"

# Run soccer vision
ros2 launch soccer_vision soccer_vision.launch.py publish_debug_image:=true > $LOG_DIR/soccer_vision.log 2>&1 &
VISION_PID=$!
echo "Soccer Vision started (PID: $VISION_PID)"

# Save PIDs to file for easy cleanup
echo $ACTION_PID > $LOG_DIR/pids.txt
echo $RQT_PID >> $LOG_DIR/pids.txt
echo $VISION_PID >> $LOG_DIR/pids.txt

echo ""
echo "All processes started! Logs in: $LOG_DIR/"
echo "To stop all processes, run: ./stop_all.sh"
echo "Or manually: kill $ACTION_PID $RQT_PID $VISION_PID"