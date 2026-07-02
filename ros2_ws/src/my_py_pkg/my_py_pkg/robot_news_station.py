import rclpy
from rclpy.node import Node
from example_interfaces.msg import String   # 內建字串訊息型別
from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy, HistoryPolicy

class RobotNewsStation(Node):
    def __init__(self):
        super().__init__("robot_news_station")

        # 宣告參數 + 預設值
        self.declare_parameter("station_name", "default_station")
        self.declare_parameter("publish_frequency", 2.0)

        # 讀參數值
        self.station_name_ = self.get_parameter("station_name").value
        freq = self.get_parameter("publish_frequency").value

        # 設定 QoS 策略
        qos_profile = QoSProfile(
            reliability=ReliabilityPolicy.RELIABLE,
            durability=DurabilityPolicy.TRANSIENT_LOCAL,
            history=HistoryPolicy.KEEP_LAST,
            depth=10
        )
        
        self.publisher_ = self.create_publisher(String, "robot_news", qos_profile)
        self.timer_ = self.create_timer(1.0 / freq, self.publish_news)
        self.get_logger().info(f"{self.station_name_} started at {freq} Hz.")


    def publish_news(self):
        msg = String()
        msg.data = f"Hello from {self.station_name_}!"
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