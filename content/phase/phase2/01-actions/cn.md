# Actions（長任務通訊）

> 用 Action 處理耗時任務：送目標、持續回報進度、可中途取消，補足 Topic 與 Service 的不足。

### 概念：三種通訊比較

```
┌──────┬────────┬──────────────┬────────────────────────────────┐
│      │ Topic  │   Service    │             Action             │
├──────┼────────┼──────────────┼────────────────────────────────┤
│ 模式 │ 串流   │ 一次請求回應 │ 長任務 + 回饋 + 可取消         │
├──────┼────────┼──────────────┼────────────────────────────────┤
│ 同步 │ 非同步 │ 同步         │ 非同步                         │
├──────┼────────┼──────────────┼────────────────────────────────┤
│ 回饋 │ 無     │ 無           │ 執行中持續回報進度             │
├──────┼────────┼──────────────┼────────────────────────────────┤
│ 取消 │ —      │ 不可         │ 可中途取消                     │
├──────┼────────┼──────────────┼────────────────────────────────┤
│ 類比 │ Kafka  │ REST         │ 長 async job + 進度條 + 取消鈕 │
└──────┴────────┴──────────────┴────────────────────────────────┘
```

何時用 Action: 任務耗時且要追進度/可取消。例: "移動到座標X" (走 10 秒)、"導航到房間"、"手臂抓取"。

Service 不行 (會卡死等太久,不能取消)。Topic 不行 (無回應無結構)。

### Action 三部分

```
Goal     → client 送目標 (如: 數到 10)
Feedback → server 執行中持續回報 (現在數到 3... 4... 5)
Result   → 完成回最終結果 (數完了, 總和 55)
```

### 目標：CountUntil action

- Goal: 數到幾 (target) + 每次間隔 (period)
- Feedback: 目前數到幾
- Result: 最終數字

### Step 1: 定義 action interface

Action 也要在 ament_cmake package (同 srv)。用現有 my_interfaces。

建 action 夾:
```sh
mkdir /root/ros2_ws/src/my_interfaces/action
```

新檔 ros2_ws/src/my_interfaces/action/CountUntil.action:

```
# Goal
int64 target_number
float64 period
---
# Result
int64 reached_number
---
# Feedback
int64 current_number
```

三段,兩個 --- 分隔 (比 srv 多一段)。順序固定: Goal / Result / Feedback。

### Step 2: 註冊到 CMakeLists

my_interfaces/CMakeLists.txt 的 rosidl_generate_interfaces 加 action 行:

```txt
rosidl_generate_interfaces(${PROJECT_NAME}
  "srv/ComputeRectangleArea.srv"
  "action/CountUntil.action"
)
```

package.xml 已有 rosidl 依賴 (1.3B 設過),不用改。

### Step 3: Build interface

```sh
cd /root/ros2_ws
colcon build --packages-select my_interfaces
source install/setup.bash
ros2 interface show my_interfaces/action/CountUntil
```
預期: 印出三段定義 = action interface 生成成功 🎯

### Step 4: Action Server

新檔 ros2_ws/src/my_py_pkg/my_py_pkg/count_until_server.py:

```py
import time
import rclpy
from rclpy.node import Node
from rclpy.action import ActionServer
from my_interfaces.action import CountUntil


class CountUntilServer(Node):
    def __init__(self):
        super().__init__("count_until_server")
        self.server_ = ActionServer(
            self,
            CountUntil,
            "count_until",
            execute_callback=self.execute_callback)
        self.get_logger().info("Count Until server started.")

    def execute_callback(self, goal_handle):
        # 讀 goal
        target = goal_handle.request.target_number
        period = goal_handle.request.period
        self.get_logger().info(f"Counting to {target}")

        # 執行 + 持續發 feedback
        feedback = CountUntil.Feedback()
        result = CountUntil.Result()
        counter = 0
        for i in range(target):
            counter += 1
            self.get_logger().info(f"  {counter}")
            feedback.current_number = counter
            goal_handle.publish_feedback(feedback)     # 發進度
            time.sleep(period)

        # 完成
        goal_handle.succeed()                          # 標記成功
        result.reached_number = counter
        return result


def main(args=None):
    rclpy.init(args=args)
    node = CountUntilServer()
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
- ActionServer(node, 型別, "名", execute_callback)
- goal_handle.request.xxx — 讀 goal 欄位
- goal_handle.publish_feedback(fb) — 執行中發進度
- goal_handle.succeed() — 標記完成
- return result — 回最終結果

▎ 註: 這版簡化 (沒處理取消)。取消邏輯 2.1 後補。

### Step 5: 註冊 + build

setup.py console_scripts 加:
            "count_until_server = my_py_pkg.count_until_server:main",

```sh
cd /root/ros2_ws
colcon build --packages-select my_py_pkg
source install/setup.bash
```

### Step 6: 跑 + CLI 測 (免寫 client)

```sh
# Terminal 1:
source install/setup.bash
ros2 run my_py_pkg count_until_server

# Terminal 2 — CLI 送 goal + 看 feedback:
source /opt/ros/jazzy/setup.bash
source /root/ros2_ws/install/setup.bash
ros2 action send_goal /count_until my_interfaces/action/CountUntil "{target_number: 5, period: 1.0}" --feedback
```

--feedback = 顯示執行中回饋。

預期: Terminal 2 每秒印 feedback current_number: 1, 2, 3...,最後 result: reached_number=5。Terminal 1 印計數。

檢視工具:
ros2 action list
ros2 action info /count_until

### Phase 2.1 驗收

1. ros2 interface show 印出 action 三段 ✅
2. send_goal --feedback 看到進度串流 + 最終 result ✅

= Action 基本拿下 (ROS 2 最複雜通訊型別)。
