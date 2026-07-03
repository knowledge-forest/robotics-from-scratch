# 第一個 Package

> Package 是 ROS 最小專案單位，從建立、編譯到寫出第一個繼承 Node 的真節點。

概念: Package = ROS 最小專案單位 (= npm package / python module)。所有 node 住在 package 裡。

### Step 1: 進容器 + 到 src

docker exec -it ros2_dev bash
容器內:
source /opt/ros/jazzy/setup.bash
cd /root/ros2_ws/src

### Step 2: 建 Python package

ros2 pkg create --build-type ament_python --node-name my_first_node my_py_pkg

### 拆解:

- pkg create = 建 package
- --build-type ament_python = Python 版 (C++ 用 ament_cmake,晚點)
- --node-name my_first_node = 順便建一個範例 node
- my_py_pkg = package 名

預期: going to create a new package + 一串建檔訊息

### Step 3: 看結構

ls -R /root/ros2_ws/src/my_py_pkg

預期結構:

```
my_py_pkg/
├── package.xml          # 元資料 + 依賴 (= package.json)
├── setup.py             # 建置設定 (= setup.py)
├── setup.cfg
├── resource/
└── my_py_pkg/
    └── my_first_node.py # 你的 node 程式碼
```

### 看懂對照:

```
┌──────────────────┬──────────────────────────────────────┐
│        檔        │                 類比                 │
├──────────────────┼──────────────────────────────────────┤
│ package.xml      │ 依賴宣告 (package.json 的 deps)      │
├──────────────────┼──────────────────────────────────────┤
│ setup.py         │ 建置+進入點 (entry_points 註冊 node) │
├──────────────────┼──────────────────────────────────────┤
│ my_first_node.py │ node 本體                            │
└──────────────────┴──────────────────────────────────────┘
```

### Step 4: 編譯

回 workspace 根 (不是 src):
cd /root/ros2_ws
colcon build
- colcon = ROS 2 建置工具 (= make/cargo)
- 一定在 ws 根跑,不在 src

預期: Finished <<< my_py_pkg + Summary: 1 package finished

### Step 5: source + 跑

source /root/ros2_ws/install/setup.bash
ros2 run my_py_pkg my_first_node
- 這次 source 的是你的 ws (不是 /opt/ros) → 才找得到你的 package

預期: Hi from my_py_pkg.

### 驗收: 看到 Hi from my_py_pkg. = Phase 1.1 過。

跑完回報。過了 → 拆解 node 程式碼 (真正懂 ROS node 怎麼寫),再進 1.2 Topics。

### 記憶點 (兩個 source)

source /opt/ros/jazzy/setup.bash        # ROS 本體 (開 shell 必做)
source /root/ros2_ws/install/setup.bash # 你的 package (build 後必做)
每次 colcon build 後要重 source 第二行。

現在拆解 node 程式碼 — 懂 ROS node 骨架,才寫得出真的。

### 看產生的 node

cat /root/ros2_ws/src/my_py_pkg/my_py_pkg/my_first_node.py

預設長這樣 (簡陋):
def main():
    print('Hi from my_py_pkg.')

if __name__ == '__main__':
    main()

這不是真 node — 只是 print。真 ROS node 要繼承 Node 類。

### 改寫成真 node

用容器內編輯器,或直接在 Mac 上改 (檔案掛載著,路徑):
~/Workspace/tutorial/robotics-engineering-from-scratch/ros2_ws/src/my_py_pkg/my_py_pkg/my_first_node.py

貼這份:

```py
import rclpy
from rclpy.node import Node


class MyFirstNode(Node):
    def __init__(self):
        super().__init__("my_first_node")   # node 名字
        self.counter_ = 0
        self.get_logger().info("Node started.")
        self.create_timer(1.0, self.timer_callback)  # 每 1 秒呼叫一次

    def timer_callback(self):
        self.counter_ += 1
        self.get_logger().info(f"Hello {self.counter_}")


def main(args=None):
    rclpy.init(args=args)          # 啟動 ROS 通訊
    node = MyFirstNode()           # 建 node
    rclpy.spin(node)               # 保持運行,處理 callback (= event loop)
    rclpy.shutdown()               # 收尾


if __name__ == "__main__":
    main()

```

### 骨架拆解 (記這 5 塊)

```
┌────────────────────────┬─────────────────────────┬───────────────────────────┐
│           塊           │          作用           │           類比            │
├────────────────────────┼─────────────────────────┼───────────────────────────┤
│ rclpy.init()           │ 啟動 ROS client library │ 連線初始化                │
├────────────────────────┼─────────────────────────┼───────────────────────────┤
│ class(Node)            │ 繼承 Node = 你的 node   │ 繼承 framework base class │
├────────────────────────┼─────────────────────────┼───────────────────────────┤
│ super().__init__("名") │ 註冊 node 名            │ 服務註冊                  │
├────────────────────────┼─────────────────────────┼───────────────────────────┤
│ create_timer           │ 週期性觸發              │ setInterval / cron        │
├────────────────────────┼─────────────────────────┼───────────────────────────┤
│ rclpy.spin()           │ 卡住+跑 callback        │ event loop (Node.js 那種) │
└────────────────────────┴─────────────────────────┴───────────────────────────┘
```

關鍵心智: ROS node = 事件驅動。spin() 是 event loop,callback 是事件處理器。你 SWE 熟。

### 重新 build + 跑

cd /root/ros2_ws
colcon build
source install/setup.bash
ros2 run my_py_pkg my_first_node

預期:
[INFO] [...] [my_first_node]: Node started.
[INFO] [...] [my_first_node]: Hello 1
[INFO] [...] [my_first_node]: Hello 2
...
每秒一行遞增。Ctrl+C 停。

### 小技巧: 免每次 rebuild

Python node 可用 symlink 模式,改碼免重 build:
colcon build --symlink-install
建一次後,改 .py 直接 ros2 run 生效 (省時)。

### 驗收: 看到 Hello 1, 2, 3... 遞增 = 你寫出第一個真 node。
