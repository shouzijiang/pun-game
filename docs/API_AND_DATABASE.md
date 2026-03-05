# 谐音梗图游戏 - 接口与表结构说明（ThinkPHP 后端）

## 一、表结构设计

### 1. 用户表（若与现有登录共用可复用已有表）

```text
表名：pun_game_user（或沿用现有 user 表）

id              int unsigned   主键自增
openid          varchar(64)    微信 openid，唯一
nickname        varchar(64)    昵称
avatar          varchar(512)   头像 URL
created_at      datetime
updated_at      datetime
```

- 登录接口通过 code 换 openid，无则新增用户，有则更新昵称/头像并返回 token。

---

### 2. 排行榜表（按闯关最高关排序）

```text
表名：pun_game_rank

id              int unsigned   主键自增
user_id         int unsigned   用户 id，唯一（一用户一条）
nickname        varchar(64)   冗余，排行展示用
avatar          varchar(512)   冗余，排行展示用
max_level       int unsigned   闯到的最高关卡号（1~253）
updated_at      datetime       最近一次通过关卡的时间
```

- 唯一索引：`user_id`。
- 排行榜查询：`ORDER BY max_level DESC, updated_at DESC`，分页。

---

### 3. 用户关卡进度表（历史答题情况）

```text
表名：pun_game_level_progress

id              int unsigned   主键自增
user_id         int unsigned   用户 id
level           int unsigned   关卡号（1~253）
passed          tinyint(1)     是否已通过：0 否 1 是
created_at      datetime
updated_at      datetime
```

- 唯一索引：`(user_id, level)`，一用户一关一条。
- 用户“当前可玩关卡” = 已通过的最大 level + 1，若从未通过则为 1。
- 已通过列表：`WHERE user_id=? AND passed=1 ORDER BY level`。

---

## 二、接口约定

- 基础 URL：与前端 `config.js` 中 `API_BASE_URL` 一致（如 `https://sofun.online`）。
- 统一响应：`{ "code": 200, "data": {...}, "message": "可选" }`；失败可 `code: 4xx`，鉴权失败 `code: 401`。
- 需要登录的接口：请求头 `Authorization: Bearer <token>`。

---

## 三、接口列表

### 1. 微信登录（已有则复用）

- **POST** `/auth/wechat/login`
- **Body**：`{ "code": "微信 wx.login 返回的 code" }`
- **响应**：`{ "code": 200, "data": { "token": "...", "user_id": 1, "openid": "...", "nickname": "...", "avatar": "..." } }`

---

### 2. 排行榜

- **GET** `/pun/rank/list?page=1&page_size=20`
- **Header**：`Authorization: Bearer <token>`（可选，未登录可只返回榜单）
- **响应**：  
  `{ "code": 200, "data": { "list": [ { "user_id": 1, "nickname": "昵称", "avatar": "头像URL", "max_level": 253, "updated_at": "03-03 11:42" } ], "total": 100 } }`  
  `updated_at` 可为格式化的最近闯关时间，便于前端展示“最近”。
- 按 `max_level` 降序、`updated_at` 降序排序。

---

### 3. 提交答案（确认答案）

- **POST** `/pun/answer/submit`
- **Header**：`Authorization: Bearer <token>`
- **Body**：  
  `{ "level": 36, "userAnswer": ["弟", "分"] }`
- **响应**：  
  `{ "code": 200, "data": { "isCorrect": false, "feedback": [ { "position": 0, "isCorrect": false }, { "position": 1, "isCorrect": false } ] } }`
  - `position`：对应 `userAnswer` 下标；`isCorrect`：该位置是否正确。
- **后端逻辑**：
  - 根据题目配置校验答案，生成 `isCorrect` 与 `feedback`。
  - 若 `isCorrect === true`：更新 `pun_game_rank`（该用户 `max_level` 取 max(当前, level)）、在 `pun_game_level_progress` 中写入或更新该用户该关 `passed=1`。

---

### 4. 当前用户关卡进度（历史答题情况）

- **GET** `/pun/level/progress`
- **Header**：`Authorization: Bearer <token>`
- **响应**：  
  `{ "code": 200, "data": { "currentLevel": 5, "passedLevels": [1, 2, 3, 4] } }`
  - `currentLevel`：当前可玩关卡（已通过最大关 + 1）。
  - `passedLevels`：已通过关卡号数组，可有序。

---

## 四、前端使用说明

- 登录：App 启动时（仅微信小程序）调用 `wechatLogin()`，与 think1-mini-uniapp 一致。
- 排行榜页：调用 `GET /pun/rank/list`，展示 `list`。
- 游戏页：填完答案后调用 `POST /pun/answer/submit`，根据 `isCorrect` 与 `feedback` 展示对错、晃动与标红。
- 关卡/首页：进入时调用 `GET /pun/level/progress`，得到 `currentLevel` 与 `passedLevels`，用于“当前关”和“已通过”展示。
