#!/bin/bash

# Script to stop all ROS2 processes started by run_all_simple.sh

LOG_DIR="ros2_logs"

if [ -f "$LOG_DIR/pids.txt" ]; then
    echo "Stopping all ROS2 processes..."
    while read pid; do
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            echo "Stopped process: $pid"
        fi
    done < $LOG_DIR/pids.txt
    rm $LOG_DIR/pids.txt
    echo "All processes stopped!"
else
    echo "No PID file found. Trying to kill by name..."
    pkill -f "webots_executor.py"
    pkill -f "rqt_image_view"
    pkill -f "soccer_vision.launch.py"
    echo "Done!"
fi