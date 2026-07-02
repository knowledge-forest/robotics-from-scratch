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