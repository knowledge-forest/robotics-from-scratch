from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    ld = LaunchDescription()

    # publisher node,帶參數
    station = Node(
        package="my_py_pkg",
        executable="robot_news_station",
        parameters=[
            {"station_name": "CNN"},
            {"publish_frequency": 3.0},
        ]
    )

    # subscriber node
    phone = Node(
        package="my_py_pkg",
        executable="smartphone",
    )

    ld.add_action(station)
    ld.add_action(phone)
    return ld