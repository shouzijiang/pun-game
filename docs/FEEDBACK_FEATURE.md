# 意见反馈功能 - 后端开发说明（ThinkPHP）

本文档供 ThinkPHP 后端实现「谐音梗图」小程序的反馈接口与数据表使用。前端已实现反馈页与 `POST /pun/feedback/submit` 调用。

---

## 一、功能概述

- 用户在「我的关卡」页点击「反馈」进入反馈页，填写**反馈类型**（选填）、**反馈内容**（必填）、**联系方式**（选填）后提交。
- 后端接收提交并落库，便于运营/产品后续处理与回复。

---

## 二、表结构设计

```text
表名：pun_game_feedback

id              int unsigned   主键自增
user_id         int unsigned   用户 id（关联 pun_game_user 或现有 user 表）
type            varchar(32)    反馈类型：空字符串表示未选，可选值见下文
content         text           反馈内容，必填
contact         varchar(128)   联系方式（选填），如微信号、手机号
created_at      datetime       提交时间
```

- **索引建议**：`user_id`、`created_at`（便于按用户或按时间查）。
- **type 取值约定**（与前端一致）：
  - `''` 或 `NULL`：未选择
  - `bug`：题目/答案错误
  - `suggest`：功能建议
  - `other`：其他

---

## 三、接口定义

### 提交反馈

- **URL**：`POST /pun/feedback/submit`
- **Header**：`Authorization: Bearer <token>`（需要登录）
- **Body（JSON）**：

| 字段     | 类型   | 必填 | 说明 |
|----------|--------|------|------|
| type     | string | 否   | 反馈类型：`bug` / `suggest` / `other`，不传或空表示未选 |
| content  | string | 是   | 反馈内容，建议限制长度（如 2~500 字） |
| contact  | string | 否   | 联系方式，建议限制长度（如 0~128 字） |

- **请求示例**：
  ```json
  {
    "type": "bug",
    "content": "第 36 关答案有误，应该是……",
    "contact": "wxid_xxx"
  }
  ```
  或仅必填项：
  ```json
  {
    "content": "希望增加夜间模式"
  }
  ```

- **响应**：
  - 成功：`{ "code": 200, "data": {} 或 null, "message": "可选" }`
  - 未登录：`{ "code": 401, "message": "未登录或登录已过期" }`
  - 参数错误：`{ "code": 400, "message": "反馈内容不能为空" }` 等

---

## 四、后端逻辑建议

1. **鉴权**：从请求头解析 token，得到 `user_id`；未登录直接返回 401。
2. **参数校验**：
   - `content`：必填，去除首尾空格后长度在 2~500（或自定）。
   - `type`：选填，若传则只允许 `bug` / `suggest` / `other`，否则存空字符串或 NULL。
   - `contact`：选填，长度 0~128。
3. **写入**：向 `pun_game_feedback` 插入一条记录，`user_id`、`type`、`content`、`contact`、`created_at`。
4. **响应**：成功返回 `code: 200`，无需在 `data` 中返回具体内容；失败返回对应 `code` 与 `message`。

---

## 五、与现有项目约定一致

- 基础 URL、统一响应格式（`code` / `data` / `message`）、鉴权方式与《API_AND_DATABASE.md》保持一致。
- 表前缀、时间字段命名等按现有 ThinkPHP 项目规范即可（如 `created_at` 可改为 `create_time`，接口字段不变即可）。

---

## 六、前端调用说明（供联调参考）

- 前端在反馈页提交时调用：`POST /pun/feedback/submit`，Body 为 `{ type?, content, contact? }`。
- 成功：前端提示「感谢反馈，我们会尽快处理」并返回上一页；失败：前端 toast 展示接口返回的 `message` 或「提交失败，请重试」。

如有新增字段或枚举，前后端对齐即可；表结构可根据需要增加状态、回复等字段用于后台管理。
