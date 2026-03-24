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
max_level       int unsigned   闯到的最高关卡号
max_mid_level  int unsigned   闯到的最高关卡号（中级）
updated_at      datetime       最近一次通过关卡的时间
```

- 唯一索引：`user_id`。
- 排行榜查询（初级）：`ORDER BY max_level DESC, updated_at DESC`，分页。
- 排行榜查询（中级）：`ORDER BY max_mid_level DESC, updated_at DESC`，分页。

- 迁移建议（方案A-表新增字段）：
  - `pun_game_rank`：新增 `max_mid_level`（以及对应“中级最近时间”字段，如果你选择拆分 `updated_at_mid`）。
  - `pun_game_level_progress`：保持原结构，不需要用 `game_tier` 区分模式。中级答题通过时只更新中级榜单（`pun_game_rank.max_mid_level`），不写入 `pun_game_level_progress`，避免初级/中级关卡号重叠导致“我的关卡”错误解锁。

---

### 3. 用户关卡进度表（历史答题情况）

```text
表名：pun_game_level_progress

id              int unsigned   主键自增
user_id         int unsigned   用户 id
level           int unsigned   关卡号（初级：1~253）
passed          tinyint(1)     是否已通过：0 否 1 是
created_at      datetime
updated_at      datetime
```

- 唯一索引：`(user_id, level)`，一用户一关一条。
- 用户“当前可玩关卡”（初级） = 已通过的最大 level + 1，若从未通过则为 1。
- 已通过列表（初级）：`WHERE user_id=? AND passed=1 ORDER BY level`。

---

### 4. 共创关卡表

```text
表名：pun_game_cocreate

id                  int unsigned   主键自增
user_id             int unsigned   上传者
answer              varchar(64)    关卡答案
answer_length       tinyint        答案字数
hint_image_prompt   varchar(512)   第一张图提示词（用于 AI 生成提示图）
answer_explanation  varchar(512)   答案解释（用于 AI 生成猜词图）
word_array          text           选词 JSON，20 个且含答案
hint_image_url      varchar(512)   提示图 URL
answer_image_url    varchar(512)   猜词图 URL
status              tinyint(1)     0 待审核 1 已通过 2 拒绝
created_at          datetime
updated_at          datetime
```

- 完整表结构、接口与前后端说明见 **《COCREATE_FEATURE.md》**。

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

### 2. 更新用户信息（头像/昵称）

- **POST** `/auth/user/update`
- **Header**：`Authorization: Bearer <token>`
- **Body**：`{ "nickname": "可选", "avatar": "可选" }`。前端在微信内通过「选择头像」「输入昵称」授权后调用；`avatar` 可能为 base64 或 URL，与后端约定。
- **响应**：`{ "code": 200, "data": null }`。后端更新用户表及排行榜表冗余字段后返回即可。
- 前端会在首页完成授权后调用本接口，并同步写入本地 `userInfo`（`uni.setStorageSync('userInfo', ...)`）。

---

### 3. 排行榜

- **GET** `/pun/rank/list?page=1&page_size=20`
- **Header**：`Authorization: Bearer <token>`（可选，未登录可只返回榜单）
- **Query(可选)**：`gameTier=beginner|mid`
- **响应**：  
  `{ "code": 200, "data": { "list": [ { "user_id": 1, "nickname": "昵称", "avatar": "头像URL", "max_level": 253, "updated_at": "03-03 11:42" } ], "total": 100 } }`  
  `updated_at` 可为格式化的最近闯关时间，便于前端展示“最近”。
  - 中级（`gameTier=mid`）时：后端需按 `pun_game_rank.max_mid_level` 排序，并将 `max_mid_level` 映射为响应字段 `max_level`，同时使用 `pun_game_rank.updated_at` 作为响应字段 `updated_at`（保证前端展示“最近”）。并且只返回有中级闯关记录的玩家（例如 `max_mid_level` 不为 NULL）。
- 当 `gameTier` 为 `beginner` 或未传：按 `max_level` 降序、`updated_at` 降序排序。
- 当 `gameTier` 为 `mid`：按 `max_mid_level` 降序、`updated_at` 降序排序，并在返回中映射为字段名 `max_level`（保证前端复用 `item.max_level` 渲染）。

---

### 4. 提交答案（确认答案）

- **POST** `/pun/answer/submit`
- **Header**：`Authorization: Bearer <token>`
- **Body**：  
  `{ "level": 36, "userAnswer": ["弟", "分"] }`
  - 初级：`gameTier` 不传（或传 `beginner`），按原逻辑处理（初级 `level` 从 1 开始）。
  - 中级：传 `gameTier: "mid"`，并且 `level` 必须等于 `issue2.json` 里该题目的 `level` 值（通常从 0 开始，且可能不连续）。
  - 示例（中级）：`{ "level": 0, "userAnswer": ["好", "久", "不", "见"], "gameTier": "mid" }`
- **响应**：  
  `{ "code": 200, "data": { "isCorrect": false, "feedback": [ { "position": 0, "isCorrect": false }, { "position": 1, "isCorrect": false } ] } }`
  - `position`：对应 `userAnswer` 下标；`isCorrect`：该位置是否正确。
- **后端逻辑**：
  - 根据题目配置校验答案，生成 `isCorrect` 与 `feedback`。
  - 若 `isCorrect === true`：
    - 当 `gameTier=beginner`：更新 `pun_game_rank.max_level = max(max_level, level)`；并在 `pun_game_level_progress` 中写入/更新 `(user_id, level)` 的 `passed=1`。
    - 当 `gameTier=mid`：更新 `pun_game_rank.max_mid_level = max(max_mid_level, level)`；并将该中级榜单的“最近时间”字段更新为当前时间。中级答题不写入 `pun_game_level_progress`，避免初级/中级关卡号重叠影响“我的关卡”。

---

### 5. 当前用户关卡进度（历史答题情况）

- **GET** `/pun/level/progress`
- **Header**：`Authorization: Bearer <token>`
- **响应**：  
  `{ "code": 200, "data": { "currentLevel": 5, "passedLevels": [1, 2, 3, 4], "totalLevels": 270, "midCurrentLevel": 0, "midTotalLevels": 156 } }`
  - `currentLevel`：当前可玩关卡（已通过最大关 + 1）。
  - `passedLevels`：已通过关卡号数组，可有序。
  - `totalLevels`：总关卡数（用于前端按范围展示）。
  - `midCurrentLevel`：中级当前可玩的“下一条真实存在的 level”。由 `pun_game_rank.max_mid_level` 以及 `issue2.json` 的有序 level 列表推导（可能从 0 起，且可能跳号，不能简单 `level+1`）。
  - `midTotalLevels`：中级题目总条目数（用于前端展示中级关卡范围）。

---

### 6. 意见反馈

- **POST** `/pun/feedback/submit`
- **Header**：`Authorization: Bearer <token>`
- **Body**：`{ "type": "可选 bug|suggest|other", "content": "必填", "contact": "选填" }`
- **响应**：`{ "code": 200, "data": null }`；失败 400/401 等。
- 表结构、校验规则与联调说明见 **《FEEDBACK_FEATURE.md》**。

---

### 7. 共创模块

- **生成选词**：`POST /pun/cocreate/words/generate`，Body `{ "answer": "..." }`，返回 20 个选词（含答案）。
- **生成图片（AI）**：`POST /pun/cocreate/image/generate`，Body `{ "prompt": "...", "type": "hint"|"answer" }`，返回 `imageUrl`。
- **提交关卡**：`POST /pun/cocreate/submit`，Body 含 answer、hintImagePrompt、answerExplanation、wordArray、hintImageUrl、answerImageUrl 等。
- **列表**：`GET /pun/cocreate/list?page=1&page_size=20`。
- **详情**：`GET /pun/cocreate/detail?id=123`（玩共创时拉题）。
- **提交共创答案**：`POST /pun/cocreate/answer/submit`，Body `{ "cocreateId": 123, "userAnswer": [...] }`。
- 表结构、请求/响应明细与前端流程见 **《COCREATE_FEATURE.md》**。

---

## 四、前端使用说明

- 登录：App 启动时（仅微信小程序）调用 `wechatLogin()`。
- 排行榜页：调用 `GET /pun/rank/list`，展示 `list`。
- 游戏页：填完答案后调用 `POST /pun/answer/submit`，根据 `isCorrect` 与 `feedback` 展示对错、晃动与标红。
- 关卡/首页：进入时调用 `GET /pun/level/progress`，得到 `currentLevel`、`passedLevels` 与 `totalLevels`（初级）；同时返回 `midCurrentLevel` 与 `midTotalLevels`（中级，用于首页进入中级玩法的起始关卡）。
- 反馈：关卡页点击「反馈」进入反馈页，填写类型/内容/联系方式后调用 `POST /pun/feedback/submit`。
- 共创：首页「进入共创」→ 共创列表/上传页；上传页含关卡答案、第一张图提示词、答案解释、生成选词(20)、AI 生成提示图/答案图、提交关卡；玩共创通过 `?cocreateId=123` 进入 play 页，详见 **《COCREATE_FEATURE.md》**。
