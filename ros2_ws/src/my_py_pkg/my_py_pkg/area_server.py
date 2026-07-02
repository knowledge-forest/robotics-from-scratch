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