# QoS（通訊品質）

> QoS 決定 topic 訊息要保證送達還是求快可丟；pub/sub 政策不相容會靜默收不到，是真機除錯最常見的雷。

### 概念

> QoS = Quality of Service = topic 通訊的可靠性/時效策略。

ROS 2 底層走 DDS (Data Distribution Service,工業級 pub/sub 中介)。DDS 讓你調: 訊息要保證送達還是求快可丟?

類比 (你 SWE): TCP (可靠, 重傳) vs UDP (快, 可丟)。QoS 就是 per-topic 選這個。

關鍵坑: publisher 跟 subscriber 的 QoS 不相容 → 收不到訊息。無錯誤,靜默失敗。ROS 2 新手最陰的雷。

### 五個主要 QoS 政策

```
┌─────────────────────┬────────────────────────────┬──────────────────────────────────┐
│        政策         │            選項            │               意義               │
├─────────────────────┼────────────────────────────┼──────────────────────────────────┤
│ Reliability         │ RELIABLE / BEST_EFFORT     │ 保證送達(重傳) vs 求快可丟       │
├─────────────────────┼────────────────────────────┼──────────────────────────────────┤
│ Durability          │ TRANSIENT_LOCAL / VOLATILE │ 保留給晚加入者 vs 只給當下在線的 │
├─────────────────────┼────────────────────────────┼──────────────────────────────────┤
│ History             │ KEEP_LAST(n) / KEEP_ALL    │ 留最近 n 筆 vs 全留              │
├─────────────────────┼────────────────────────────┼──────────────────────────────────┤
│ Depth               │ 數字                       │ queue 大小 (搭 KEEP_LAST)        │
├─────────────────────┼────────────────────────────┼──────────────────────────────────┤
│ Deadline / Lifespan │ 時間                       │ 進階,先略                        │
└─────────────────────┴────────────────────────────┴──────────────────────────────────┘
```

### 實務對照 (何時用什麼)

```
┌──────────────────┬────────────────────────────┬──────────────────────────────┐
│     資料型別     │        Reliability         │             原因             │
├──────────────────┼────────────────────────────┼──────────────────────────────┤
│ 相機影像 / LiDAR │ BEST_EFFORT                │ 量大高頻,丟幾張無所謂,求即時 │
├──────────────────┼────────────────────────────┼──────────────────────────────┤
│ 控制指令 / 目標  │ RELIABLE                   │ 不能丟,漏了機器人亂動        │
├──────────────────┼────────────────────────────┼──────────────────────────────┤
│ 地圖 / 靜態設定  │ RELIABLE + TRANSIENT_LOCAL │ 晚上線的 node 也要拿到最後值 │
└──────────────────┴────────────────────────────┴──────────────────────────────┘
```

心智: 高頻可丟 → best_effort;關鍵不可丟 → reliable;要"最後已知值" → transient_local。

### 動手: 看 QoS + 製造不相容

1. 看現有 topic 的 QoS

server 開著 (robot_news_station 或 count 都行),或起個 publisher。查:
ros2 topic info /robot_news --verbose
預期: 印出 publisher 的 QoS profile — Reliability: RELIABLE, Durability: VOLATILE 等。

```
QoS profile:
  Reliability: RELIABLE
  History (Depth): UNKNOWN
  Durability: VOLATILE
  Lifespan: Infinite
  Deadline: Infinite
  Liveliness: AUTOMATIC
  Liveliness lease duration: Infinite
```

2. 程式碼設 QoS

改 robot_news_station.py 的 publisher,用自訂 QoS:

from rclpy.qos import QoSProfile, ReliabilityPolicy, DurabilityPolicy, HistoryPolicy

```py
# ... 在 __init__ 內:
        qos = QoSProfile(
            reliability=ReliabilityPolicy.BEST_EFFORT,
            durability=DurabilityPolicy.VOLATILE,
            history=HistoryPolicy.KEEP_LAST,
            depth=10,
        )
        self.publisher_ = self.create_publisher(String, "robot_news", qos)
```
- 第三參數從 10 改成 qos 物件 (數字其實是 depth 的簡寫)

```py
subscriber (smartphone.py) 也要設相容 QoS:
from rclpy.qos import QoSProfile, ReliabilityPolicy

        qos = QoSProfile(reliability=ReliabilityPolicy.BEST_EFFORT, depth=10)
        self.subscriber_ = self.create_subscription(
            String, "robot_news", self.callback_news, qos)
```
3. Build + 跑相容版

cd /root/ros2_ws
colcon build --packages-select my_py_pkg
source install/setup.bash
兩 terminal 跑 station + smartphone → 正常收到 (兩邊都 BEST_EFFORT)。

4. 製造不相容 (看靜默失敗)

把 subscriber 改回 RELIABLE:
        qos = QoSProfile(reliability=ReliabilityPolicy.RELIABLE, depth=10)
publisher 留 BEST_EFFORT。rebuild,兩邊跑。

預期: smartphone 收不到任何訊息,無錯誤訊息。

原因: RELIABLE subscriber 不接受 BEST_EFFORT publisher (要求比對方高,不相容)。

▎ 相容規則: subscriber 要求 ≤ publisher 提供。RELIABLE sub 要 RELIABLE pub;BEST_EFFORT sub 可收兩者。

5. 診斷工具

ros2 topic info /robot_news --verbose
看兩邊 QoS 對不對得上。以後 topic 靜默沒資料,先查這個。

### 驗收

1. topic info --verbose 看得到 QoS profile ✅
2. 兩邊 BEST_EFFORT → 通;pub best_effort + sub reliable → 靜默失敗 ✅
3. 懂為何失敗 (相容規則) ✅

= QoS 拿下。這是真機除錯最常卡的雷 (sensor 收不到 9 成是 QoS)。
