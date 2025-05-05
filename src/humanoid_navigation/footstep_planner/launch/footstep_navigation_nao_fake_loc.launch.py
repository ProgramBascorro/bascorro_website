
from launch import LaunchDescription
from launch_ros.actions import Node, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from ament_index_python.packages import get_package_share_directory

def generate_launch_description():
    nao_driver_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('nao_driver'), '/launch/nao_footsteps.launch.py'])
    )

    nao_remote_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('nao_remote'), '/launch/nao_remote.launch.py'])
    )

    fake_loc_from_odom_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('footstep_planner'), '/launch/fake_loc_from_odom.launch.py'])
    )

    map_server_node = Node(
        package='map_server',
        executable='map_server',
        name='map_server',
        output='screen',
        parameters=[{'yaml_filename': get_package_share_directory('footstep_planner') + '/maps/sample.yaml'}]
    )

    rviz_footstep_navigation_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('footstep_planner'), '/launch/rviz_footstep_navigation.launch.py'])
    )

    footstep_navigation_nao_launch = IncludeLaunchDescription(
        PythonLaunchDescriptionSource([get_package_share_directory('footstep_planner'), '/launch/footstep_navigation_nao.launch.py'])
    )

    return LaunchDescription([
        nao_driver_launch,
        nao_remote_launch,
        fake_loc_from_odom_launch,
        map_server_node,
        rviz_footstep_navigation_launch,
        footstep_navigation_nao_launch
    ])