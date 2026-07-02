import time
import rclpy
from rclpy.node import Node
from rclpy.action import ActionServer
from rclpy.action.server import ServerGoalHandle
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from my_interfaces.action import CountUntil

class CountUntilServer(Node):
    def __init__(self):
        super().__init__("count_until_server")
        self.server_ = ActionServer(
            self,
            CountUntil,
            "count_until",
            execute_callback=self.execute_callback,
             cancel_callback=self.cancel_callback,          # 新增
            callback_group=ReentrantCallbackGroup())
        self.get_logger().info("Count Until server started.")
    
    def cancel_callback(self, goal_handle: ServerGoalHandle):
        self.get_logger().info("Cancel request received.")
        from rclpy.action import CancelResponse
        return CancelResponse.ACCEPT
        

    def execute_callback(self, goal_handle: ServerGoalHandle):
        # 讀 goal
        target = goal_handle.request.target_number
        period = goal_handle.request.period
        self.get_logger().info(f"Counting to {target}")

        # 執行 + 持續發 feedback
        feedback = CountUntil.Feedback()
        result = CountUntil.Result()
        counter = 0
        for i in range(target):
            # 每圈檢查是否被要求取消
            if goal_handle.is_cancel_requested:
                self.get_logger().info("Goal canceled.")
                goal_handle.canceled()
                result.reached_number = counter
                return result

            counter += 1
            self.get_logger().info(f"  {counter}")
            feedback.current_number = counter
            goal_handle.publish_feedback(feedback)
            time.sleep(period)


        # 完成
        goal_handle.succeed()                          # 標記成功
        result.reached_number = counter
        return result

def main(args=None):
    rclpy.init(args=args)
    node = CountUntilServer()
    executor = MultiThreadedExecutor()
    executor.add_node(node)
    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()