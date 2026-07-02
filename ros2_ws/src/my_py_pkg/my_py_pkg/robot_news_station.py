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