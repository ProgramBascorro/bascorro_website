from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    image_topic = LaunchConfiguration('image_topic')
    publish_topic = LaunchConfiguration('publish_topic')
    model_path = LaunchConfiguration('model_path')
    confidence = LaunchConfiguration('confidence')
    use_dummy = LaunchConfiguration('use_dummy_detections')
    dummy_radius = LaunchConfiguration('dummy_radius')
    enable_ball = LaunchConfiguration('enable_ball_detection')
    enable_field = LaunchConfiguration('enable_field_landmarks')
    camera_height = LaunchConfiguration('camera_height')
    camera_pitch = LaunchConfiguration('camera_pitch_deg')
    hfov = LaunchConfiguration('hfov_deg')
    vfov = LaunchConfiguration('vfov_deg')
    output_frame = LaunchConfiguration('output_frame')
    publish_debug = LaunchConfiguration('publish_debug_image')
    debug_topic = LaunchConfiguration('debug_image_topic')

    return LaunchDescription([
        DeclareLaunchArgument(
            'image_topic',
            default_value='/robotis_op3/camera/image_raw',
            description='Camera topic to subscribe to.'
        ),
        DeclareLaunchArgument(
            'publish_topic',
            default_value='/ball_detector_node/circle_set',
            description='Topic that publishes op3_ball_detector_msgs/CircleSetStamped messages.'
        ),
        DeclareLaunchArgument(
            'model_path',
            default_value='',
            description='Optional YOLO weights path. Leave empty for dummy detections.'
        ),
        DeclareLaunchArgument(
            'confidence',
            default_value='0.4',
            description='Detection confidence threshold passed to the YOLO model.'
        ),
        DeclareLaunchArgument(
            'use_dummy_detections',
            default_value='true',
            description='Publish deterministic detections without running a model.'
        ),
        DeclareLaunchArgument(
            'dummy_radius',
            default_value='0.18',
            description='Normalized radius used when dummy detections are generated.'
        ),
        DeclareLaunchArgument(
            'enable_ball_detection',
            default_value='true',
            description='Publish orange ball detections for the walking / soccer demo.'
        ),
        DeclareLaunchArgument(
            'enable_field_landmarks',
            default_value='true',
            description='Extract white lines, circle, and goal posts for localization.'
        ),
        DeclareLaunchArgument(
            'camera_height',
            default_value='0.47',
            description='Camera height from the ground plane (meters).'
        ),
        DeclareLaunchArgument(
            'camera_pitch_deg',
            default_value='-18.0',
            description='Camera pitch relative to the ground (degrees).'
        ),
        DeclareLaunchArgument(
            'hfov_deg',
            default_value='62.0',
            description='Horizontal field of view in degrees.'
        ),
        DeclareLaunchArgument(
            'vfov_deg',
            default_value='36.0',
            description='Vertical field of view in degrees.'
        ),
        DeclareLaunchArgument(
            'output_frame',
            default_value='base_link',
            description='Frame used when publishing ground-plane measurements.'
        ),
        DeclareLaunchArgument(
            'publish_debug_image',
            default_value='false',
            description='Publish an overlay image showing detections.'
        ),
        DeclareLaunchArgument(
            'debug_image_topic',
            default_value='/soccer_vision/debug_image',
            description='Topic name for the debug overlay image.'
        ),
        Node(
            package='soccer_vision',
            executable='soccer_vision_node',
            name='soccer_vision',
            output='screen',
            parameters=[
                {
                    'image_topic': image_topic,
                    'publish_topic': publish_topic,
                    'model_path': model_path,
                    'confidence_threshold': confidence,
                    'use_dummy_detections': use_dummy,
                    'dummy_radius': dummy_radius,
                    'enable_ball_detection': enable_ball,
                    'enable_field_landmarks': enable_field,
                    'camera_height': camera_height,
                    'camera_pitch_deg': camera_pitch,
                    'hfov_deg': hfov,
                    'vfov_deg': vfov,
                    'output_frame': output_frame,
                    'publish_debug_image': publish_debug,
                    'debug_image_topic': debug_topic,
                }
            ]
        ),
    ])
