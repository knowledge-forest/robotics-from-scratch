# ros2 bag（錄製與回放）

> 用 ros2 bag 錄下 topic 資料存檔再回放，讓你免開真機就能離線重跑、除錯與比較演算法。

### 概念

ros2 bag = 錄 topic 資料存檔,之後回放 (= tcpdump / DVR / 錄影)。

用途 (真機開發命脈):
- 錄真機 sensor 資料 → 之後離線重跑演算法,免每次開機器人
- Debug: 錄下出錯瞬間,反覆回放分析
- 測試: 同一份錄製資料餵不同版本演算法,公平比較
- 對應中文課「機械臂錄製+回放」(塊2)

存成 SQLite/MCAP 檔,含訊息 + 時間戳 (回放保留原時序)。

### Step 1: 準備 — 起一個 publisher

Terminal 1:
source /opt/ros/jazzy/setup.bash
source /root/ros2_ws/install/setup.bash
ros2 run my_py_pkg robot_news_station
持續發 /robot_news。

### Step 2: 錄製

```sh
Terminal 2:
source /opt/ros/jazzy/setup.bash
cd /root/ros2_ws   # 錄到掛載目錄,檔案留 Mac 上
# 錄單一 topic
ros2 bag record /robot_news
```
預期: Recording...,建出 rosbag2_YYYY_MM_DD-HH_MM_SS/ 資料夾。

錄幾秒 → Ctrl+C 停。

這就是威力: 錄一次真機資料 → 之後無限次餵給任何 node 開發測試,不用真機。sim-to-real 開發的日常工具。

其他錄法:
```
ros2 bag record /robot_news /number_count      # 多 topic
ros2 bag record -a                             # 全部 topic
ros2 bag record -o my_recording /robot_news    # 指定輸出名
```

### Step 3: 檢視錄製內容

ros2 bag info rosbag2_2026_07_02-XX_XX_XX
(換成你實際夾名,ls 可看)

預期: 印出:
- Duration (時長)
- Messages (訊息數)
- Topic + 型別 + count
- Storage (mcap/sqlite3)

= 不用回放就知道錄了啥。

### Step 4: 回放

先關掉 Terminal 1 的 publisher (Ctrl+C) — 證明資料來自 bag 非真 publisher。

Terminal 2 回放:
ros2 bag play rosbag2_2026_07_02-XX_XX_XX

Terminal 3 (新開) 監看:
source /opt/ros/jazzy/setup.bash
ros2 topic echo /robot_news

預期: publisher 已關,但 echo 仍收到訊息 — 來自 bag 回放。時序跟原本一致 🎯

回放選項:
ros2 bag play <bag> --rate 2.0      # 2 倍速
ros2 bag play <bag> --loop          # 循環播
ros2 bag play <bag> --rate 0.5

### 驗收

1. ros2 bag record 建出 bag 夾 ✅
2. ros2 bag info 看得到 topic/訊息數 ✅
3. publisher 關掉,ros2 bag play 仍能讓 subscriber 收到 ✅

= ros2 bag 拿下。

### .gitignore 注意

bag 檔可能大 (sensor 影像更大)。建議加:
```
ros2_ws/*.db3
ros2_ws/*.mcap
rosbag2_*/
```
避免誤 commit 大檔。
