# Robotic Code OP3

![alt text](./images/image.png)

## Build & Run

```
colcon build --continue-on-error
source install/setup.bash
```

Image debugging:

```
ros2 run rqt_image_view rqt_image_view
```


```
ros2 launch soccer_vision soccer_vision.launch.py publish_debug_image:=true

```

## Package Groups

The workspace is now grouped by responsibility to make upstream forks vs. in-house packages obvious:

- `src/third_party/`: vendor stacks (all `ROBOTIS-*` packages, `DynamixelSDK`, `sbpl`). Keep these untouched unless you intentionally fork upstream.
- `src/perception/`: internal perception stacks such as `face_detection` and `soccer_vision`.
- `src/navigation/`: humanoid navigation and walking nodes (`humanoid_navigation`, `walking_imu_to_odometry`).
- `src/interfaces/`: shared message definitions (`humanoid_msgs`).

`colcon` recursively scans `src/`, so the reorganized layout is discovered automatically—no extra workspace configuration needed.

## TODO

- [ ] Docker
- [ ] Lokalisasi
