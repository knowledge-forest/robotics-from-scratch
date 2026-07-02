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