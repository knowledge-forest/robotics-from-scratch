# Topics（發布/訂閱）

> 用 Publisher/Subscriber 打通 ROS 最核心的 Topic 通訊，一發一收即時串流資料。

### 概念

Topic = pub/sub 通道 (= Kafka/MQTT)。
- Publisher 發訊息到 topic (不管誰收)
- Subscriber 訂 topic 收訊息 (不管誰發)
- 多對多、非同步、單向串流
- 用途: sensor 資料、影像、速度指令 — 90% ROS 通訊

```
[Publisher] --/topic--> [Subscriber]
   node A                  node B
```

SWE 類比: message queue 的 topic。解耦,發收方互不知。

### 目標: 建兩 node

- robot_news_station (publisher) — 每秒發一句話
- smartphone (subscriber) — 收到就印

用同一個 my_py_pkg,加兩個新檔。

### Step 1: Publisher node

新檔:
ros2_ws/src/my_py_pkg/my_py_pkg/robot_news_station.py

```py
import rclpy
from rclpy.node import Node
from example_interfaces.msg import String   # 內建字串訊息型別


class RobotNewsStation(Node):
    def __init__(self):
        super().__init__("robot_news_station")
        # 建 publisher: (訊息型別, topic名, queue大小)
        self.publisher_ = self.create_publisher(String, "robot_news", 10)
        self.create_timer(0.5, self.publish_news)   # 每 0.5 秒發一次
        self.get_logger().info("Robot News Station started.")

    def publish_news(self):
        msg = String()
        msg.data = "Hello from robot news station"
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

新概念:
- example_interfaces.msg.String = 標準訊息型別 (msg = 資料契約 = protobuf)
- create_publisher(型別, "topic名", 10) — 10 = queue 大小 (滿了丟舊的)
- 發訊要先建 msg 物件,填 .data,再 publish()

### Step 2: Subscriber node

新檔:
ros2_ws/src/my_py_pkg/my_py_pkg/smartphone.py

```py
import rclpy
from rclpy.node import Node
from example_interfaces.msg import String


class Smartphone(Node):
    def __init__(self):
        super().__init__("smartphone")
        # 建 subscriber: (型別, topic名, callback, queue大小)
        self.subscriber_ = self.create_subscription(
            String, "robot_news", self.callback_news, 10)
        self.get_logger().info("Smartphone started.")

    def callback_news(self, msg):
        self.get_logger().info(f"Received: {msg.data}")   # 收到就觸發


def main(args=None):
    rclpy.init(args=args)
    node = Smartphone()
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

關鍵: publisher 用 timer 主動發; subscriber 無 timer,靠 callback 被動觸發 (收到才動)。event-driven。

### Step 3: 註冊 entry points

改 ros2_ws/src/my_py_pkg/setup.py,找 entry_points 區塊,加兩行:

```py
    entry_points={
        'console_scripts': [
            "my_first_node = my_py_pkg.my_first_node:main",
            "robot_news_station = my_py_pkg.robot_news_station:main",
            "smartphone = my_py_pkg.smartphone:main",
        ],
    },
```

- 格式: "可執行名 = package.檔名:函式"
- 沒註冊 → ros2 run 找不到

### Step 4: 依賴宣告

改 ros2_ws/src/my_py_pkg/package.xml,在其他 <depend> 附近加:

<depend>rclpy</depend>
<depend>example_interfaces</depend>

- 宣告用到 example_interfaces (String 訊息來源)
- 好習慣,別漏

### Step 5: Build + 跑

cd /root/ros2_ws

```bash
colcon build
source install/setup.bash

# Terminal 1 (publisher):
source install/setup.bash
ros2 run my_py_pkg robot_news_station

# Terminal 2 (新開 docker exec -it ros2_dev bash, subscriber):
source /opt/ros/jazzy/setup.bash
source /root/ros2_ws/install/setup.bash
ros2 run my_py_pkg smartphone
```

預期: Terminal 2 每 0.5 秒印 Received: Hello from robot news station

### Step 6: 用 CLI 檢視 (重要工具)

第三個 terminal:
source /opt/ros/jazzy/setup.bash
ros2 topic list                    # 列所有 topic → 見 /robot_news
ros2 topic echo /robot_news        # 直接偷看 topic 內容
ros2 topic info /robot_news        # 看幾個 pub/sub
ros2 topic hz /robot_news          # 發布頻率 (應 ~2Hz)

ros2 topic echo = 神器,除錯必用 (不用寫 subscriber 就能看資料)。

### 驗收:

1. smartphone 持續收到訊息 ✅
2. ros2 topic echo /robot_news 看得到 data ✅

= Phase 1.2 過。ROS 精髓拿下。
