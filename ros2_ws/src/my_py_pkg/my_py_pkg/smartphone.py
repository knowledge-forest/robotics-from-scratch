import rclpy
from rcply.node import Node
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