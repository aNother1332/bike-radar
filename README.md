# 你科神车

标记和查询校园滴滴共享电单车速度状态的微信小程序，基于微信云开发 2.0（SQL 型数据库 PostgreSQL）。

> 本项目仅在**南方科技大学**校园内部使用，用于辨别校内滴滴共享电单车中被限速的"慢车"。

## 功能

- **主页**：扫码（解析滴滴二维码中的 `vehicleId` 参数）或输入 8 位车号进入车辆信息页
- **车辆信息页**：
  - 三色渐变背景对应速度状态：慢速 = 红、普速 = 黄、神速 = 绿
  - 顶部大字显示当前速度状态，由最近 3 次投票计算
  - 车号只读；车牌号（6 位数字）扫码进入可编辑，失焦自动保存并留修改记录
  - 三个投票按钮（慢速 / 普速 / 神速），按钮下方实时显示各选项人数
- **计票规则**：取最新 3 票，最高票唯一则取之；任何平票判为普速；无投票默认普速
- **权限分层**：扫码进入（证明人在车旁）可投票、可编辑车牌；手动输入车号仅可查看
- **一人一车一票**：重复投票即改票，云端以 `vehicle_id + openid` 唯一约束保证

## 结构

```
miniprogram/
  pages/index/    主页（扫码 + 车号输入）
  pages/detail/   车辆信息页（渐变状态页 + 投票）
  utils/cloud.js  云函数调用与二维码解析封装
cloudfunctions/
  bike/           唯一云函数，按 type 分发：ensureVehicle / getVehicle / vote / updatePlate
```

## 数据表（public schema）

- `vehicles`：`vehicle_id`（主键）、`plate`、`created_at`
- `votes`：`vehicle_id` + `openid`（联合唯一）、`choice`（slow/normal/fast）、`updated_at`
- `plate_logs`：车牌修改流水（旧值、新值、修改人）

## 本地开发

1. `miniprogram/app.js` 中已配置云环境 ID，如需更换在此修改
2. 云函数部署（需开启开发者工具服务端口）：
   ```
   cli cloud functions deploy --e <环境ID> --n bike --r --project <项目路径>
   ```
3. 数据表已在线上建好；如需重建，建表与授权 SQL 见 git 历史
