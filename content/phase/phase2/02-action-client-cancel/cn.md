# Action Client + 取消

> 寫 Python action client 收 feedback/result，並用 executor 與 callback group 讓長任務可被中途取消。

### 先補 Server: 支援取消

現在 server 不能取消。加取消處理。改 count_until_server.py:

```py
import time
import rclpy
from rclpy.node import Node
from rclpy.action import ActionServer
from rclpy.action.server import ServerGoalHandle
from rclpy.callback_groups import ReentrantCallbackGroup
from my_interfaces.action import CountUntil


class CountUntilServer(Node):
    def __init__(self):
        super().__init__("count_until_server")
        self.server_ = ActionServer(
            self,
            CountUntil,
            "count_until",
            execute_callback=self.execute_callback,
            cancel_callback=self.cancel_callback,          # 新增
            callback_group=ReentrantCallbackGroup())       # 新增
        self.get_logger().info("Count Until server started.")

    def cancel_callback(self, goal_handle: ServerGoalHandle):
        self.get_logger().info("Cancel request received.")
        from rclpy.action import CancelResponse
        return CancelResponse.ACCEPT                        # 接受取消

    def execute_callback(self, goal_handle: ServerGoalHandle):
        target = goal_handle.request.target_number
        period = goal_handle.request.period
        self.get_logger().info(f"Counting to {target}")

        feedback = CountUntil.Feedback()
        result = CountUntil.Result()
        counter = 0
        for i in range(target):
            # 每圈檢查是否被要求取消
            if goal_handle.is_cancel_requested:
                self.get_logger().info("Goal canceled.")
                goal_handle.canceled()
                result.reached_number = counter
                return result

            counter += 1
            self.get_logger().info(f"  {counter}")
            feedback.current_number = counter
            goal_handle.publish_feedback(feedback)
            time.sleep(period)

        goal_handle.succeed()
        result.reached_number = counter
        return result
```

取消三要素:
- cancel_callback 回 CancelResponse.ACCEPT — 同意可取消
- 執行迴圈每圈查 goal_handle.is_cancel_requested
- 被取消 → goal_handle.canceled() + return

### 2.2 插播: 為何要 ReentrantCallbackGroup

問題: server 執行 time.sleep 卡住迴圈時,取消請求怎麼被聽到?

答: 靠 executor + callback group。

Executor = ROS 的 callback 調度器

- rclpy.spin(node) 底層 = SingleThreadedExecutor (單執行緒)
- 單執行緒 = callback 一次跑一個,前一個沒跑完後面排隊
- execute_callback 在 sleep → 若同群,cancel_callback 排不進來 → 取消失效

Callback Group = 併發規則

```
┌───────────────────────────────────────┬───────────────────────────────┐
│                 型別                  │             行為              │
├───────────────────────────────────────┼───────────────────────────────┤
│ MutuallyExclusiveCallbackGroup (預設) │ 同群 callback 不併發,一個個來 │
├───────────────────────────────────────┼───────────────────────────────┤
│ ReentrantCallbackGroup                │ 同群 callback 可併發          │
└───────────────────────────────────────┴───────────────────────────────┘
```

解: action server 用 ReentrantCallbackGroup → execute 跑時,cancel 能同時插入 → 取消聽得到。

但 Reentrant 需要多執行緒 executor 才真併發。

類比 (你 SWE):
- Executor = event loop / thread pool
- SingleThreaded = 單執行緒 event loop (Node.js)
- MultiThreaded = thread pool
- Callback group = 併發策略 (哪些能同時跑)

### 改 main: 用 MultiThreadedExecutor

count_until_server.py 的 main 改:

```py
from rclpy.executors import MultiThreadedExecutor

def main(args=None):
    rclpy.init(args=args)
    node = CountUntilServer()
    executor = MultiThreadedExecutor()          # 多執行緒
    executor.add_node(node)
    try:
        executor.spin()                         # 用 executor 而非 rclpy.spin
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()
```

心智: 要併發處理 (執行中還能收取消/其他請求) → MultiThreadedExecutor + ReentrantCallbackGroup。單純 node 不需要,預設 spin 就好。

### Step: Action Client (Python)

新檔 ros2_ws/src/my_py_pkg/my_py_pkg/count_until_client.py:

```py
import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from my_interfaces.action import CountUntil


class CountUntilClient(Node):
    def __init__(self):
        super().__init__("count_until_client")
        self.client_ = ActionClient(self, CountUntil, "count_until")

    def send_goal(self, target, period):
        self.client_.wait_for_server()                  # 等 server
        goal = CountUntil.Goal()
        goal.target_number = target
        goal.period = period
        self.get_logger().info("Sending goal...")
        # 送 goal + 註冊 feedback callback
        self.client_.send_goal_async(
            goal, feedback_callback=self.feedback_callback
        ).add_done_callback(self.goal_response_callback)

    def goal_response_callback(self, future):
        self.goal_handle_ = future.result()
        if not self.goal_handle_.accepted:
            self.get_logger().warn("Goal rejected.")
            return
        self.get_logger().info("Goal accepted.")
        # 拿最終結果
        self.goal_handle_.get_result_async().add_done_callback(
            self.result_callback)

    def feedback_callback(self, feedback_msg):
        current = feedback_msg.feedback.current_number
        self.get_logger().info(f"Feedback: {current}")

    def result_callback(self, future):
        result = future.result().result
        self.get_logger().info(f"Result: {result.reached_number}")


def main(args=None):
    rclpy.init(args=args)
    node = CountUntilClient()
    node.send_goal(6, 1.0)
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

Client 流程 (三層 future,event-driven):
1. send_goal_async → server 接受/拒絕 (goal_response_callback)
2. feedback_callback — 執行中持續收進度
3. get_result_async → 最終結果 (result_callback)

比 service client 多層 (goal接受 → feedback → result)。這是 action 複雜處。

### Build + 跑

setup.py 加:
            "count_until_client = my_py_pkg.count_until_client:main",

```sh
cd /root/ros2_ws
colcon build --packages-select my_py_pkg
source install/setup.bash

# Terminal 1:
source install/setup.bash
ros2 run my_py_pkg count_until_server

# Terminal 2:
source /opt/ros/jazzy/setup.bash
source /root/ros2_ws/install/setup.bash
ros2 run my_py_pkg count_until_client
```
預期: client 印 Goal accepted → Feedback: 1..6 → Result: 6

### 測取消 (CLI 最快)

server 開著,Terminal 2 送長 goal 然後 Ctrl+C:
```sh
ros2 action send_goal /count_until my_interfaces/action/CountUntil "{target_number: 100, period: 0.5}" --feedback
```
數到中途按 Ctrl+C → server 應印 Cancel request received + Goal canceled。取消生效 = executor/callback group 起作用。

### 驗收

1. Python client 收 feedback + result ✅
2. 中途 Ctrl+C → server 印 canceled ✅

= Action 完整 (server/client/feedback/cancel) + 懂 executor/callback group。Phase 2 最硬部分過。

### 記憶點

```
單純 node        → rclpy.spin (單執行緒足夠)
要併發/取消/多請求 → MultiThreadedExecutor + ReentrantCallbackGroup
```
