# Parameters + Launch（工程化）

> runtime 調參讓同一 node 展現不同行為，再用 launch 檔一鍵編排多節點。

Phase 1 收尾。兩主題: runtime 調參 + 多節點編排。

### Part A — Parameters

### 概念

Parameter = node 的 runtime 設定 (= env var / feature flag / config)。
- 啟動時給值,免改碼
- 同一 node,不同參數 → 不同行為 (可重用)

類比: docker run -e KEY=val / CLI flag。

### 改造 robot_news_station 加參數

讓「電台名」「發布頻率」可調。改 robot_news_station.py:

```py
import rclpy
from rclpy.node import Node
from example_interfaces.msg import String


class RobotNewsStation(Node):
    def __init__(self):
        super().__init__("robot_news_station")

        # 宣告參數 + 預設值
        self.declare_parameter("station_name", "default_station")
        self.declare_parameter("publish_frequency", 2.0)

        # 讀參數值
        self.station_name_ = self.get_parameter("station_name").value
        freq = self.get_parameter("publish_frequency").value

        self.publisher_ = self.create_publisher(String, "robot_news", 10)
        self.create_timer(1.0 / freq, self.publish_news)   # 頻率 → 週期
        self.get_logger().info(f"{self.station_name_} started at {freq} Hz.")

    def publish_news(self):
        msg = String()
        msg.data = f"Hello from {self.station_name_}"
        self.publisher_.publish(msg)


def main(args=None):
    rclpy.init(args=args)
    node = RobotNewsStation()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
```

三步: declare_parameter(名, 預設) → get_parameter(名).value 讀 → 用。

### Build + 跑 (帶參數)

```bash
cd /root/ros2_ws
colcon build --packages-select my_py_pkg
source install/setup.bash
```

預設跑:
```bash
ros2 run my_py_pkg robot_news_station
```
預期: default_station started at 2.0 Hz.

帶參數跑 (--ros-args -p 名:=值):
```bash
ros2 run my_py_pkg robot_news_station --ros-args -p station_name:=BBC -p publish_frequency:=5.0
```
預期: BBC started at 5.0 Hz. — 同碼,不同行為 🎯

驗證頻率:
```bash
ros2 topic hz /robot_news   # 應 ~5Hz
```

### Part B — Launch files

### 概念

Launch = 一鍵起多 node + 設參數 (= docker-compose / k8s manifest)。
- 手動一個個 ros2 run 太累
- launch 檔宣告: 起哪些 node、給什麼參數、remap 什麼

### 慣例: 獨立 launch package

Launch 檔通常放專門的 xxx_bringup package。先建:

```sh
cd /root/ros2_ws/src
ros2 pkg create my_bringup --build-type ament_cmake
cd my_bringup
rm -r include src
mkdir launch
```

改 my_bringup/CMakeLists.txt,find_package(ament_cmake REQUIRED) 下加:
install(DIRECTORY
  launch
  DESTINATION share/${PROJECT_NAME}
)
- 讓 launch 檔被安裝進 install (才找得到)

### 寫 launch 檔

新檔 ros2_ws/src/my_bringup/launch/news_system.launch.py:

```py
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
```

結構:
- Node(package, executable, parameters=[...]) = 描述一個要起的 node
- parameters 用 dict list 設參數
- add_action 加進 launch 描述

### Build + 跑

cd /root/ros2_ws
colcon build --packages-select my_bringup
source install/setup.bash
ros2 launch my_bringup news_system.launch.py

預期: 一個指令同時起 station (CNN, 3Hz) + smartphone,兩者 log 交錯出現:
[robot_news_station-1] [INFO] ... CNN started at 3.0 Hz.
[smartphone-2] [INFO] ... Received: Hello from CNN
[smartphone-2] [INFO] ... Received: Hello from CNN

檢視:
ros2 node list      # 另一 terminal → 見兩 node 都活著

### Phase 1.4 驗收

1. -p 帶參數改變 node 行為 ✅
2. ros2 launch 一鍵起兩 node,參數生效 ✅

### 🏁 Phase 1 大專案 (capstone)

整合所學,自己做 (查前面碼,別複製):

做一個 number 系統:
1. number_publisher node — 每秒發一個數字 (Int64)。數字用 parameter 設 (預設 2)
2. number_counter node — 訂數字,累加,把總和發到另一 topic /number_count
3. number_counter 加一個 service /reset_counter — 呼叫時歸零 (用內建 example_interfaces/srv/SetBool)
4. 寫 launch 檔一鍵起兩 node,number_publisher 參數設 5

用到: Topic (pub+sub) + Parameter + Service + Launch = Phase 1 全部。
