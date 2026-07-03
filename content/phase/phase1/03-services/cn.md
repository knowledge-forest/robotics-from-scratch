# Services（同步請求/回應）

> 用 request/response 模式做同步呼叫，server 收請求回結果，client 以 future 非同步取回應。

### 概念: Topic vs Service

```
┌──────┬───────────────────┬────────────────────────┐
│      │       Topic       │        Service         │
├──────┼───────────────────┼────────────────────────┤
│ 模式 │ pub/sub 串流      │ request/response       │
├──────┼───────────────────┼────────────────────────┤
│ 方向 │ 單向、多對多      │ 雙向、一對一           │
├──────┼───────────────────┼────────────────────────┤
│ 同步 │ 非同步 (發了不等) │ 同步 (等回應)          │
├──────┼───────────────────┼────────────────────────┤
│ 類比 │ Kafka / MQTT      │ REST / RPC             │
├──────┼───────────────────┼────────────────────────┤
│ 用途 │ sensor 連續資料   │ 觸發動作、查詢、算一次 │
└──────┴───────────────────┴────────────────────────┘
```

判準: 要「連續流」用 Topic; 要「問一次拿答案」用 Service。

[Client] --request--> [Server]
[Client] <--response-- [Server]

Service interface = 兩塊: Request + Response (中間 --- 分隔)。

### 分兩段

- 1.3A: 用內建 srv (AddTwoInts) 做 server + client
- 1.3B: 自訂 srv (需獨立 interface package — 重要概念)

### 1.3A — Server + Client (內建 interface)

先看內建 srv 長相:
ros2 interface show example_interfaces/srv/AddTwoInts
預期:
int64 a
int64 b
---
int64 sum
上半 = request (a, b),下半 = response (sum)。--- 分隔。

### Step 1: Server node

新檔 ros2_ws/src/my_py_pkg/my_py_pkg/add_server.py:

```py
import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts


class AddServer(Node):
    def __init__(self):
        super().__init__("add_server")
        # 建 service server: (srv型別, service名, callback)
        self.server_ = self.create_service(
            AddTwoInts, "add_two_ints", self.callback_add)
        self.get_logger().info("Add server ready.")

    def callback_add(self, request, response):
        response.sum = request.a + request.b        # 算
        self.get_logger().info(
            f"{request.a} + {request.b} = {response.sum}")
        return response                              # 必須 return response


def main(args=None):
    rclpy.init(args=args)
    node = AddServer()
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

關鍵:
- create_service(型別, "名", callback)
- callback 收 request, 填 response, 必須 return response
- 收到請求才觸發 (event-driven,像 HTTP handler)

### Step 2: Client node

新檔 ros2_ws/src/my_py_pkg/my_py_pkg/add_client.py:

```py
import rclpy
from rclpy.node import Node
from example_interfaces.srv import AddTwoInts


class AddClient(Node):
    def __init__(self):
        super().__init__("add_client")
        self.client_ = self.create_client(AddTwoInts, "add_two_ints")
        # 等 server 上線 (server 沒開就等)
        while not self.client_.wait_for_service(timeout_sec=1.0):
            self.get_logger().info("Waiting for server...")
        self.send_request(3, 7)

    def send_request(self, a, b):
        request = AddTwoInts.Request()
        request.a = a
        request.b = b
        # 非同步呼叫,拿 future
        future = self.client_.call_async(request)
        future.add_done_callback(self.callback_response)

    def callback_response(self, future):
        response = future.result()
        self.get_logger().info(f"Result: {response.sum}")


def main(args=None):
    rclpy.init(args=args)
    node = AddClient()
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
- wait_for_service() — server 沒上線先等 (避免呼叫失敗)
- call_async() → 回 future (= JS Promise)。非同步,不卡 event loop
- future.add_done_callback() — 回應到了才觸發 (= .then())

▎ 為何非同步: ROS spin 是單執行緒 event loop,同步等會死鎖。future 模式標準。

### Step 3: 註冊 entry points

setup.py 的 console_scripts 加:
            "add_server = my_py_pkg.add_server:main",
            "add_client = my_py_pkg.add_client:main",

### Step 4: Build + 跑

```bash
cd /root/ros2_ws
colcon build
source install/setup.bash

# Terminal 1 (server):
source install/setup.bash
ros2 run my_py_pkg add_server

# Terminal 2 (client):
source /opt/ros/jazzy/setup.bash
source /root/ros2_ws/install/setup.bash
ros2 run my_py_pkg add_client
```

預期: client 印 Result: 10,server 印 3 + 7 = 10

### Step 5: CLI 呼叫 service (神器)

免寫 client,直接命令列打 server:
```bash
ros2 service list                  # 列 service → 見 /add_two_ints
ros2 service type /add_two_ints    # 看型別
ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts "{a: 5, b: 8}"
```
預期: 回 sum=13。ros2 service call = 除錯 server 神器 (= curl 打 API)。

### 1.3A 驗收: client 得 10 + CLI call 得 13 = 過。
