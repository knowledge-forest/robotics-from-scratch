# ROS 2 軟體工程師 Roadmap

> 為 AI 全端 SWE 設計。純軟體 / 模擬,0 硬體起步。難度循序上升,每階段有驗收專案。

**總長**: ~4-6 個月 (每週 8-12h)
**原則**: 每階段先跑通再往上。專案驗收 > 讀懂。難度標 ⚡(1-5)

---

## Progress

- [x] 0
- [x] 1-1
- [x] 1-2
- [x] 1-3
- [x] 1-4
- [ ] 2
- [ ] 3-1
- [ ] 3-2
- [ ] 3-3
- [ ] 4-1
- [ ] 4-2 (A, B)
- [ ] 5
- [ ] 6



## Phase 0 — 前置環境 (1 週) ⚡2

**目標**: 能跑 ROS 2,不卡環境。

| 主題 | 內容 |
|---|---|
| Ubuntu | 雙系統 24.04 或 Docker (`osrf/ros:jazzy`)。推 Docker 起步,乾淨可丟 |
| Linux CLI | 已會 (SWE 底子)。補: `source`, 環境變數, `.bashrc` |
| 建置工具 | `colcon build`, `ament_cmake`, workspace 結構 |
| ROS 版本 | **Jazzy** (2024 LTS, Ubuntu 24.04) |

**驗收**: Docker 起 ROS 2,跑通 `ros2 run demo_nodes_cpp talker` + `listener`。
**坑**: 環境變數沒 source → 命令找不到。這關卡最多人。

---

## Phase 1 — ROS 2 核心通訊 (3-4 週) ⚡2→3

**目標**: 掌握節點如何溝通。ROS 2 主體。

### 1.1 骨架 (第1週)
- Node 概念 (= microservice)
- Package 建立 (Python `ament_python` 先,C++ `ament_cmake` 後)
- Workspace / `colcon build` / `source install/setup.bash`
- **驗收**: 手寫 hello node,編譯運行

### 1.2 Topics (第2週) — 最重要 ⚡3
- 發布者 / 訂閱者
- `ros2 topic` CLI, `rqt_graph` 視覺化
- 標準 msg 型別
- **驗收**: 兩節點,一發數字一收印。turtlesim 遙控

### 1.3 Services + Interfaces (第3週) ⚡3
- Service client/server (= 同步 RPC)
- 自訂 **msg / srv** (= protobuf schema)
- **驗收**: 自訂 srv 做加法 server + client

### 1.4 工程化 (第4週) ⚡2
- Parameters (runtime 調參)
- Launch files (多節點編排 = docker-compose)
- **驗收**: launch 一次起 3 節點 + 帶參數

**Phase 1 大專案**: Turtlesim 完整控制 — 鍵盤遙控 + 畫圖 + 參數調速 + launch 編排。

---

## Phase 2 — 進階通訊 + 除錯 (2 週) ⚡3

**目標**: 補齊入門課常漏但核心的部分。

| 主題 | 為何重要 |
|---|---|
| **Actions** | 長任務+回饋+可取消 (如"移動到X")。實務必備 |
| **執行模型** | Callback groups, executors, 多執行緒 (真機必踩) |
| **QoS / DDS** | 可靠性 vs 即時性。sensor 用 best-effort,指令用 reliable |
| 除錯工具 | `rqt`, `ros2 bag` (錄放資料), `ros2 doctor` |

**驗收**: 寫 action server 模擬"計時任務",client 可取消+看進度。`ros2 bag` 錄一段 topic 再回放。

---

## Phase 3 — 空間與模型 (3-4 週) ⚡4 ← 真正的坎

**目標**: 從"程式"進化到"機器人"。**這階段是分水嶺。**

### 3.1 tf2 — 座標變換 (核心中的核心) ⚡4
- 座標系 (frame) 概念: world, base, camera, end-effector
- Transform tree, `tf2_echo`, `view_frames`
- 廣播 / 監聽 transform
- **這是唯一無 SWE 類比的全新概念。務必啃透。**

### 3.2 空間數學 (補課) ⚡4
- 旋轉表示: 歐拉角、四元數 (quaternion)、旋轉矩陣
- 齊次變換 SE(3)
- 為何四元數 (避免萬向鎖 gimbal lock)

### 3.3 URDF — 機器人建模 ⚡3
- Link (連桿) + Joint (關節)
- `robot_state_publisher`
- RViz2 視覺化模型
- **驗收**: 手寫 2-3 關節手臂 URDF,RViz 看到,tf tree 正確

**Phase 3 大專案**: 建雙關節手臂 URDF → RViz 顯示 → 滑桿動關節 → tf2 印末端位置。**通了 = 真懂機器
人軟體。**

---

## Phase 4 — 模擬與運動 (4-5 週) ⚡4→5

**目標**: 純軟體跑完整機器人邏輯。

### 4.1 物理模擬 ⚡4
- **Gazebo** (ROS 官方) 或 **MuJoCo** (輕、AI 圈熱)
- URDF → SDF,加物理: 質量、碰撞、關節限制
- 模擬 sensor (相機、LiDAR、IMU)

### 4.2 選一條深入 (別兩條都學)

**路 A: 機械臂 (manipulation)** — 推薦
- **MoveIt 2** 框架
- 正解 (FK) / 反解 (IK) — 概念+用框架 (不手刻數學)
- 運動規劃 (OMPL): RRT, PRM
- **驗收**: 模擬臂,給目標點自動規劃路徑抓取

**路 B: 移動機器人 (navigation)**
- **Nav2** 堆疊
- SLAM (建圖) — `slam_toolbox`
- 定位 + 路徑規劃 + 避障
- **驗收**: 模擬車在地圖自主導航到目標

> AI 背景 → 兩條都可,但 **路 A (手臂)** 接後續 AI 整合 + 未來玩真臂較順。

---

## Phase 5 — AI 整合 (3-4 週) ⚡3 ← 你的主場

**目標**: 發揮 AI/SWE 優勢,把 LLM/視覺接進機器人。

| 主題 | 你的優勢 |
|---|---|
| 視覺感知 | OpenCV + ROS image topic,你會 CV 直接用 |
| 語音 | Whisper 語音辨識 |
| LLM 控制 | LLM API → 解析意圖 → 發 ROS 指令 |
| **MCP + ROS** | MCP server 包 ROS 動作,LLM 呼叫驅動機器人 |
| 機器人學習 | (進階) RL in sim, imitation learning, sim-to-real |

**驗收**: 語音 → Whisper → LLM → MCP → 模擬機器人執行動作。全鏈路。**差異化戰力。**

---

## Phase 6 — 收尾/深化 (持續) ⚡5

- **C++ 補完**: 控制迴路、即時節點必需。回頭把關鍵 node 用 C++ 重寫
- 即時性 (real-time): 為何 Python 不夠、RT kernel
- 讀開源: ROS 2 官方 demo、MoveIt 原始碼
- 準備真硬體 (若要): MyCobot 280 (官方 ROS 2 支援)

---

## 難度曲線總覽

```
⚡ 5 │                            ╱‾‾ Ph6
   4 │              Ph3 ╱‾‾╲ Ph4 ╱
   3 │        Ph1_╱‾   Ph2  ╲__╱ Ph5
   2 │  Ph0_╱
   1 │
     └────────────────────────────────
       月1    月2    月3    月4   月5+
```

**最痛兩關**:
1. **Phase 0 環境** — 時間黑洞,非概念難。Docker 解。
2. **Phase 3 tf2/空間數學** — 概念真難,全新。慢慢啃,是分水嶺。

其餘 SWE 底子都有類比,快。

---

## SWE 視角對照表

| ROS 2 概念 | 熟悉類比 |
|---|---|
| Node | microservice |
| Topics | pub/sub, Kafka, message queue |
| Services | REST/RPC 同步呼叫 |
| Actions | 長任務 + 進度回報 (async job + status) |
| Interfaces (msg/srv) | protobuf / API schema |
| Launch files | docker-compose / k8s manifest |
| Parameters | env config / feature flags |
| DDS/QoS | 網路層 QoS, at-least-once vs best-effort |
| tf2 | **無對應 — 全新**,座標系關係圖 |

90% 有類比,學很快。唯一全新 = tf2 + 空間數學。

---

## 核心資源

- **docs.ros.org** — 官方 tutorial (Jazzy)。beginner→intermediate 全免費,最權威
- **Modern Robotics** (Lynch/Park) — 數學/FK/IK 聖經,有 Coursera
- **MoveIt 2 / Nav2 官方教學** — Phase 4

---

## 逆向: 整條路怎麼搞砸

- 環境卡太久放棄 → Docker
- 只看影片不動手 → 每概念跑一個 node
- 跳過 tf2 → Phase 4 全崩
- Phase 4 兩條都學 → 都不精,選一條
- 死守 Python 不碰 C++ → 真機/即時卡死,Phase 6 務必補
- 想一次買硬體 → 先純軟體通概念,省錢省命