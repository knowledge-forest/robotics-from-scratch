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