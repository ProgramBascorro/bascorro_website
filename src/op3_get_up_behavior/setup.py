from setuptools import find_packages, setup
import os # Add this
from glob import glob # Add this

package_name = 'op3_get_up_behavior'

setup(
    name=package_name,
    version='0.0.1',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        # Install the YAML motion script files
        # Adjust 'resource/motion_scripts' if you put them elsewhere
        (os.path.join('share', package_name, 'motion_scripts'), glob(os.path.join('resource', 'motion_scripts', '*.yaml'))),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Your Name',
    maintainer_email='your@email.com',
    description='Get-up behavior node using YAML scripts',
    license='Apache License 2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'get_up_node = op3_get_up_behavior.get_up_node:main',
        ],
    },
)