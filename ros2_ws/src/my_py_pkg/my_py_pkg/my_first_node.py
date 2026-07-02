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

    try:
        rclpy.spin(node)               # 保持運行,處理 callback (= event loop)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()            # 銷毀 node
        rclpy.shutdown()               # 收尾


if __name__ == "__main__":
    main()
