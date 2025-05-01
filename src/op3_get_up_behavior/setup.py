# filepath: /home/farhan/motion_webots/src/op3_get_up_behavior/setup.py
from setuptools import setup
import os
from glob import glob

package_name = 'op3_get_up_behavior'

setup(
    name=package_name,
    version='0.0.1',
    packages=[package_name],
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        # Sertakan file launch jika ada
        (os.path.join('share', package_name, 'launch'), glob('launch/*.launch.py')),
        # Sertakan file config jika ada
        # (os.path.join('share', package_name, 'config'), glob('config/*.yaml')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='Your Name',
    maintainer_email='your@email.com',
    description='Simple get-up behavior node for OP3',
    license='Apache License 2.0', # Or your license
    # HAPUS BARIS INI ATAU BARIS SERUPA:
    # tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'get_up_behavior = op3_get_up_behavior.get_up_behavior:main',
        ],
    },
)