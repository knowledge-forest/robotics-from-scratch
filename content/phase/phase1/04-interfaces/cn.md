# 自訂 Interface（msg/srv）

> Python 無法自產 interface，需建獨立 ament_cmake package 集中 msg/srv 並生成跨語言型別。

### 關鍵觀念 (先記)

> **Python package 不能自己產 interface。 必須建獨立的 ament_cmake package 專門放 msg/srv。**

原因: interface 靠 C++ 程式碼生成 (跨語言相容),Python 建置系統做不到。

慣例: 一個專案配一個 xxx_interfaces package,集中所有自訂 msg/srv。

my_interfaces/   ← ament_cmake, 只放 .msg/.srv
my_py_pkg/       ← ament_python, 你的 node,依賴上面

### 目標

建自訂 srv ComputeRectangleArea:
- request: 長 + 寬
- response: 面積 + 周長

### Step 1: 建 interface package

```bash
cd /root/ros2_ws/src
ros2 pkg create my_interfaces --build-type ament_cmake
```

- 注意: ament_cmake (不是 python!),因要產 interface
- 不加 --node-name (這 package 只放 interface,無 node)

### Step 2: 清掉沒用的資料夾,建 srv 夾

```bash
cd /root/ros2_ws/src/my_interfaces
rm -r include src
mkdir srv
```

- ament_cmake 預設產 include/ src/ 放 C++ 碼,這 package 不用
- srv/ 放 service 定義 (msg 放 msg/)

### Step 3: 寫 srv 檔

新檔 ros2_ws/src/my_interfaces/srv/ComputeRectangleArea.srv:

```srv
float64 length
float64 width
---
float64 area
float64 perimeter
```

- 上半 request,---,下半 response
- 檔名必大寫開頭 (PascalCase),.srv 結尾。規定,錯了不編譯

### Step 4: 改 CMakeLists.txt

ros2_ws/src/my_interfaces/CMakeLists.txt,在 find_package(ament_cmake REQUIRED) 下面加:

find_package(rosidl_default_generators REQUIRED)

rosidl_generate_interfaces(${PROJECT_NAME}
  "srv/ComputeRectangleArea.srv"
)

ament_export_dependencies(rosidl_default_runtime)
- rosidl_generate_interfaces = 產生 interface 的核心指令
- 每加一個 srv/msg,都要列進這清單

### Step 5: 改 package.xml

ros2_ws/src/my_interfaces/package.xml,在 
```xml
<buildtool_depend>ament_cmake</buildtool_depend> 附近加:

<buildtool_depend>rosidl_default_generators</buildtool_depend>
<exec_depend>rosidl_default_runtime</exec_depend>
<member_of_group>rosidl_interface_packages</member_of_group>
```

### Step 6: Build interface package

```bash
cd /root/ros2_ws
colcon build --packages-select my_interfaces
source install/setup.bash
```
- --packages-select = 只建這個 (省時)

驗證產生成功:
ros2 interface show my_interfaces/srv/ComputeRectangleArea
預期: 印出你定義的四個欄位 = 成功產生 🎯

### Step 7: 用自訂 srv 寫 server

新檔 ros2_ws/src/my_py_pkg/my_py_pkg/area_server.py:

```py
import rclpy
from rclpy.node import Node
from my_interfaces.srv import ComputeRectangleArea    # 你自訂的!


class AreaServer(Node):
    def __init__(self):
        super().__init__("area_server")
        self.server_ = self.create_service(
            ComputeRectangleArea, "compute_area", self.callback_area)
        self.get_logger().info("Area server ready.")

    def callback_area(self, request, response):
        response.area = request.length * request.width
        response.perimeter = 2 * (request.length + request.width)
        self.get_logger().info(
            f"{request.length} x {request.width} "
            f"-> area={response.area}, perimeter={response.perimeter}")
        return response


def main(args=None):
    rclpy.init(args=args)
    node = AreaServer()
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

### Step 8: my_py_pkg 依賴 my_interfaces

ros2_ws/src/my_py_pkg/package.xml 加:
<depend>my_interfaces</depend>
- 宣告依賴自訂 interface package。漏了會編譯錯

setup.py 的 console_scripts 加:
            "area_server = my_py_pkg.area_server:main",

### Step 9: Build 全部 + 跑
```bash
cd /root/ros2_ws
colcon build
source install/setup.bash

# Terminal 1:
source install/setup.bash
ros2 run my_py_pkg area_server

# Terminal 2 (CLI 打,免寫 client):
source /opt/ros/jazzy/setup.bash
source /root/ros2_ws/install/setup.bash
ros2 service call /compute_area my_interfaces/srv/ComputeRectangleArea "{length: 4.0, width: 3.0}"
```
預期: 回 area=12.0, perimeter=14.0,server 印算式

### 驗收

1. ros2 interface show my_interfaces/srv/ComputeRectangleArea 印出欄位 ✅
2. service call 回 area=12, perimeter=14 ✅

= Phase 1.3 完整過。你會建+用自訂 interface = ROS 2 分水嶺技能之一。

### 常見坑

```
┌───────────────────────────┬─────────────────────────────────────────────┐
│           症狀            │                    原因                     │
├───────────────────────────┼─────────────────────────────────────────────┤
│ interface show 找不到     │ build 沒過 / 沒 source                      │
├───────────────────────────┼─────────────────────────────────────────────┤
│ import my_interfaces 失敗 │ my_py_pkg 漏 <depend>my_interfaces</depend> │
├───────────────────────────┼─────────────────────────────────────────────┤
│ srv 不生成                │ CMakeLists 沒列檔名 / package.xml 缺 rosidl │
├───────────────────────────┼─────────────────────────────────────────────┤
│ 檔名報錯                  │ srv 檔名非 PascalCase                       │
└───────────────────────────┴─────────────────────────────────────────────┘
```
