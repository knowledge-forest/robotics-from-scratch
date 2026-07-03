# 環境建置（Docker + ROS 2）

> 用 Docker 起乾淨的 ROS 2 Jazzy 環境，跑通內建 talker/listener 兩節點對話，確認通訊活著。

### 概念

純軟體起步，0 硬體。用 Docker 跑 ROS 2 Jazzy（2024 LTS），環境乾淨可丟，不卡系統。掛載 host 目錄 → 檔案留在 Mac 上。

### Step 1: 拉 ROS 2 Jazzy image

```bash
docker pull osrf/ros:jazzy-desktop
```

- desktop 版含 RViz/rqt/turtlesim GUI 工具 (Phase 1 要用)
- ~1-2GB,拉一次。arm64 自動選對
- 預期: 一堆 Pull complete → Status: Downloaded

驗證:

```bash
docker images | grep jazzy
```

預期: 看到 osrf/ros jazzy-desktop

### Step 2: 建持久 workspace (host 端)

容器內檔案關掉會丟。掛載 host 目錄 → 檔案留 Mac 上。

```bash
mkdir -p ~/Workspace/projects/robotics-engineering-from-scratch/ros2_ws/src
```

- ros2_ws = 你的工作空間
- src = 放 package 原始碼處 (ROS 慣例)

### Step 3: 起容器

```bash
docker run -it --rm \
  --name ros2_dev \
  -v ~/Workspace/projects/robotics-engineering-from-scratch/ros2_ws:/root/ros2_ws \
  osrf/ros:jazzy-desktop \
  bash
```

拆解:
- -it = 互動終端
- --rm = 關掉自動刪容器 (檔案在掛載目錄,不怕)
- --name ros2_dev = 容器命名
- -v host路徑:容器路徑 = 掛載。你 Mac 的 ros2_ws ↔ 容器 /root/ros2_ws
- 最後 bash = 進 shell

預期: prompt 變 root@容器id:/# → 你在容器內了

### Step 4: 容器內驗證 ROS 2

進容器後:

```bash
source /opt/ros/jazzy/setup.bash
```

- 載入 ROS 2 環境。每開新 shell 都要 source (最常忘,命令找不到就是這)

```bash
ros2 --help
```

預期: 一堆子命令 (run, topic, node, service...)

### Step 5: 驗收 — talker/listener

ROS 2 內建 demo。兩節點對話 = 通訊活著。

Terminal 1 (現有容器內):

```bash
source /opt/ros/jazzy/setup.bash
ros2 run demo_nodes_cpp talker
```

預期: Publishing: 'Hello World: 1' 每秒一行

Terminal 2 — 新 Mac 終端,進同容器:

```bash
docker exec -it ros2_dev bash
```

容器內:

```bash
source /opt/ros/jazzy/setup.bash
ros2 run demo_nodes_cpp listener
```

預期: I heard: [Hello World: 1] — 收到 talker 發的

兩邊數字對上 = Phase 0 通過。 🎯

停止: 各 terminal Ctrl+C。

### 常見坑

```
┌─────────────────────────┬──────────────────────┬──────────────────────────────────┐
│          症狀           │         原因         │                解                │
├─────────────────────────┼──────────────────────┼──────────────────────────────────┤
│ ros2: command not found │ 沒 source            │ source /opt/ros/jazzy/setup.bash │
├─────────────────────────┼──────────────────────┼──────────────────────────────────┤
│ listener 沒收到         │ 沒同容器 / 沒 source │ 用 docker exec 進同一 ros2_dev   │
├─────────────────────────┼──────────────────────┼──────────────────────────────────┤
│ pull 很慢               │ image 大             │ 等,或換網路                      │
└─────────────────────────┴──────────────────────┴──────────────────────────────────┘
```
