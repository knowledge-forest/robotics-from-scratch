# Curriculum

> Machine-readable source of truth for the site. `build.js` parses the phase
> headers + lesson tables below into `data.js`. Human narrative lives in
> `ROADMAP.md`. Status: ✅ complete · 🚧 in-progress · ⬚ planned.

## Phase 0 — 前置環境 — ✅
> 用 Docker 起乾淨的 ROS 2 Jazzy 環境，不卡系統。純軟體 0 硬體起步。

| # | Lesson | Type | Lang | Status | Path |
|---|--------|------|------|--------|------|
| 01 | 環境建置（Docker + ROS 2） | Build | Docker | ✅ | content/phase/phase0/01-environment |

## Phase 1 — ROS 2 核心通訊 — ✅
> 掌握節點如何溝通。Topics、Services、自訂 Interface、Launch — ROS 2 主體。

| # | Lesson | Type | Lang | Status | Path |
|---|--------|------|------|--------|------|
| 01 | 第一個 Package | Build | Python | ✅ | content/phase/phase1/01-package |
| 02 | Topics（發布/訂閱） | Build | Python | ✅ | content/phase/phase1/02-topics |
| 03 | Services（同步請求/回應） | Build | Python | ✅ | content/phase/phase1/03-services |
| 04 | 自訂 Interface（msg/srv） | Build | Python | ✅ | content/phase/phase1/04-interfaces |
| 05 | Parameters + Launch（工程化） | Build | Python | ✅ | content/phase/phase1/05-parameters-launch |

## Phase 2 — 進階通訊 + 除錯 — 🚧
> 補齊入門課常漏但核心的部分：Actions、執行模型、QoS、除錯工具。

| # | Lesson | Type | Lang | Status | Path |
|---|--------|------|------|--------|------|
| 01 | Actions（長任務通訊） | Build | Python | ✅ | content/phase/phase2/01-actions |
| 02 | Action Client + 取消 | Build | Python | ✅ | content/phase/phase2/02-action-client-cancel |
| 03 | 執行模型（Executors / Callback Groups） | Learn | Python | ⬚ | |
| 04 | QoS（通訊品質） | Learn | — | ✅ | content/phase/phase2/03-qos |
| 05 | ros2 bag（錄製與回放） | Build | — | ✅ | content/phase/phase2/04-ros2-bag |

## Phase 3 — 空間與模型 — ⬚
> 從「程式」進化到「機器人」。tf2 座標變換 + 空間數學 + URDF。這階段是分水嶺。

| # | Lesson | Type | Lang | Status | Path |
|---|--------|------|------|--------|------|
| 01 | tf2（座標變換） | Learn | Python | ⬚ | |
| 02 | 空間數學（四元數 / SE(3)） | Learn | — | ⬚ | |
| 03 | URDF（機器人建模） | Build | XML | ⬚ | |

## Phase 4 — 模擬與運動 — ⬚
> 純軟體跑完整機器人邏輯。物理模擬 + 選一條深入（機械臂 或 移動機器人）。

| # | Lesson | Type | Lang | Status | Path |
|---|--------|------|------|--------|------|
| 01 | 物理模擬（Gazebo / MuJoCo） | Build | — | ⬚ | |
| 02 | 路 A：機械臂（MoveIt 2） | Build | Python | ⬚ | |
| 03 | 路 B：移動機器人（Nav2 / SLAM） | Build | Python | ⬚ | |

## Phase 5 — AI 整合 — ⬚
> 發揮 AI/SWE 優勢，把視覺、語音、LLM 接進機器人。差異化戰力。

| # | Lesson | Type | Lang | Status | Path |
|---|--------|------|------|--------|------|
| 01 | 視覺感知（OpenCV + ROS） | Build | Python | ⬚ | |
| 02 | 語音辨識（Whisper） | Build | Python | ⬚ | |
| 03 | LLM 控制 | Build | Python | ⬚ | |
| 04 | MCP + ROS | Build | Python | ⬚ | |

## Phase 6 — 收尾 / 深化 — ⬚
> C++ 補完、即時性、讀開源、準備真硬體。持續深化。

| # | Lesson | Type | Lang | Status | Path |
|---|--------|------|------|--------|------|
| 01 | C++ 補完 | Build | C++ | ⬚ | |
| 02 | 即時性（Real-time） | Learn | — | ⬚ | |
| 03 | 讀開源 + 準備真硬體 | Learn | — | ⬚ | |
