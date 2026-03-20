# 共创模块 - 前后端开发文档

## 一、业务概述

- **入口**：首页提供「开始游戏」与「进入共创」两个入口；进入共创后可浏览共创列表或上传新关卡。
- **共创上传流程**（参考 UI）：
  1. **关卡答案**：用户输入本关答案（如「车水马龙」）。
  2. **第一张图的提示词**：用于 AI 生成「提示图」的文案。
  3. **答案解释**：用于 AI 生成「猜词图/答案图」的文案（如：请画出汽车、水池、蚂蚁、龙作为第二个图）。
  4. **选词（20 个）**：自动生成 20 个候选字/词，且必须包含正确答案中的字；支持「生成选词」「重新生成」「+ 添加」。
  5. **提示图**：支持「AI 生成图片」（根据第一张图提示词）或本地上传。
  6. **答案图**：支持「AI 生成图片」（根据答案解释）或本地上传。
  7. **提交关卡**：将答案、提示词、答案解释、选词、两张图 URL 提交给服务端。
- **共创列表**：展示已通过的共创关卡（缩略图 + 摘要），可点击进入「玩该共创」。
- **玩共创**：与现有游戏页一致，根据共创 id 拉取题目（提示图/答案图、提示文案、选词、答案），支持提交答案、对错反馈。
- **分享**：分享链接带 `cocreateId`，好友打开后直接玩该共创。

---

## 二、表结构（后端）

### 共创关卡表 `pun_game_cocreate`

```text
id                  int unsigned   主键自增
user_id             int unsigned   上传者 user_id
answer              varchar(64)    关卡答案（如「车水马龙」）
answer_length       tinyint        答案字数（用于前端答案槽数量）
hint_image_prompt   varchar(512)    第一张图的提示词（用于生成提示图）
answer_explanation  varchar(512)    答案解释（用于生成猜词图）
word_array          text           选词 JSON，如 ["车","水","马","龙",...]，共 20 个且含答案中的字
hint_image_url      varchar(512)    提示图 URL
answer_image_url    varchar(512)    猜词图/答案图 URL
status              tinyint(1)      0 待审核 1 已通过 2 拒绝，列表/详情只返回 1
created_at          datetime
updated_at          datetime
```

- 索引建议：`user_id`、`status`、`created_at`。
- 玩法和现有官方关卡一致：前端需要 `hintText` 时可用 `hint_image_prompt` 或单独字段；展示图可用 `hint_image_url`（提示图）与 `answer_image_url`（猜词图），与现有 `imageUrl` 对应关系由前后端约定（例如列表用提示图，玩时用猜词图或两张都展示）。

---

## 三、后端接口列表

### 1. 生成选词（20 个，含答案）

- **POST** `/pun/cocreate/words/generate`
- **Header**：`Authorization: Bearer <token>`
- **Body**：`{ "answer": "车水马龙" }`
- **响应**：`{ "code": 200, "data": { "wordArray": ["车","水","马","龙", ...共20个], "answerLength": 4 } }`
- **说明**：后端根据答案生成 20 个候选字/词，必须包含答案中的每一个字（可拆分为单字或保留词语）。前端可多次调用「重新生成」；可选支持「+ 添加」时再调接口追加或由前端本地追加后随提交一起上传。

### 2. 生成提示图（AI）

- **POST** `/pun/cocreate/image/generate`
- **Header**：`Authorization: Bearer <token>`
- **Body**：`{ "prompt": "第一张图的提示词内容", "type": "hint" }`
- **响应**：`{ "code": 200, "data": { "imageUrl": "https://..." } }`
- **说明**：后端调用内部或第三方绘图接口，根据 `prompt` 生成图片并落盘/CDN，返回可访问的 `imageUrl`。`type` 用于区分提示图/答案图。

### 3. 生成答案图/猜词图（AI）

- **POST** `/pun/cocreate/image/generate`
- **Header**：`Authorization: Bearer <token>`
- **Body**：`{ "prompt": "答案解释内容", "type": "answer" }`
- **响应**：`{ "code": 200, "data": { "imageUrl": "https://..." } }`
- **说明**：与提示图共用同一接口，通过 `type` 区分；或拆成两个路径，如 `/pun/cocreate/image/generate/hint` 与 `/pun/cocreate/image/generate/answer`，由后端统一约定即可。

### 4. 提交共创关卡

- **POST** `/pun/cocreate/submit`
- **Header**：`Authorization: Bearer <token>`
- **Body**：
  ```json
  {
    "answer": "车水马龙",
    "answerLength": 4,
    "hintImagePrompt": "第一张图的提示词",
    "answerExplanation": "请画出汽车、水池、蚂蚁、龙作为第二个图。",
    "wordArray": ["车","水","马","龙", ...],
    "hintImageUrl": "https://...",
    "answerImageUrl": "https://..."
  }
  ```
- **校验**：`answer`、`wordArray`（长度 20）、`hintImageUrl`、`answerImageUrl` 必填；`wordArray` 中必须包含 `answer` 中各字；可校验 `answerLength` 与 `answer` 字数一致。
- **响应**：`{ "code": 200, "data": { "id": 123 } }`；失败 400/401。

### 5. 共创列表（分页）

- **GET** `/pun/cocreate/list?page=1&page_size=20`
- **Header**：`Authorization` 可选
- **响应**：
  ```json
  {
    "code": 200,
    "data": {
      "list": [
        {
          "id": 1,
          "userId": 1,
          "nickname": "昵称",
          "avatar": "头像URL",
          "answer": "车水马龙",
          "hintImageUrl": "https://...",
          "answerImageUrl": "https://...",
          "createdAt": "2025-03-06 12:00"
        }
      ],
      "total": 100
    }
  }
  ```
- 只返回 `status=1` 的关卡；按 `created_at` 或 `id` 倒序。

### 6. 共创详情（玩某条共创时拉题）

- **GET** `/pun/cocreate/detail?id=123`
- **Header**：`Authorization` 可选
- **响应**：
  ```json
  {
    "code": 200,
    "data": {
      "id": 123,
      "hintText": "第一张图的提示词或简短提示",
      "imageUrl": "https://...（猜词图，与现有 play 一致可复用 answer_image_url）",
      "hintImageUrl": "https://...（提示图，可选）",
      "wordArray": ["车","水","马","龙", ...],
      "answerLength": 4,
      "answer": "车水马龙"
    }
  }
  ```
- 与现有 `getLevelPuzzle` 返回结构对齐：`imageUrl` 可为猜词图；`hintText` 可用 `hint_image_prompt` 或摘要；`wordArray`、`answerLength`、`answer` 用于答题与校验。

### 7. 提交共创题目答案（玩共创时）

- **POST** `/pun/cocreate/answer/submit`
- **Header**：`Authorization: Bearer <token>`
- **Body**：`{ "cocreateId": 123, "userAnswer": ["车","水","马","龙"] }`
- **响应**：与现有 `/pun/answer/submit` 一致：`{ "code": 200, "data": { "isCorrect": true, "feedback": [...] } }`
- 后端根据 `pun_game_cocreate` 中该 id 的 `answer` 与 `answer_length` 校验，生成 `feedback`。

---

## 四、前端开发说明

### 4.1 页面与路由

| 页面       | 路径                    | 说明 |
|------------|-------------------------|------|
| 首页       | `pages/index/index`     | 增加「进入共创」入口。 |
| 共创列表   | `pages/cocreate/list`   | 列表展示，点击某条进入「玩该共创」。 |
| 共创上传   | `pages/cocreate/upload`| 表单：关卡答案、第一张图提示词、答案解释、选词(0/20)、提示图、答案图、提交关卡。 |
| 玩共创     | `pages/play/play`       | 通过 `?cocreateId=123` 区分；有则拉共创详情并走共创答案提交。 |

### 4.2 上传页 UI 与逻辑（对齐参考 UI）

- **关卡答案**：单行输入，提交时必填。
- **第一张图的提示词**：多行输入，用于「AI 生成」提示图。
- **答案解释**：多行输入，用于「AI 生成」答案图。
- **选词（0/20）**：
  - 展示已选词数量与列表；「生成选词」调用 `POST /pun/cocreate/words/generate`（传当前答案），回填 `wordArray` 与 `answerLength`。
  - 「重新生成」再次调用同一接口覆盖；「+ 添加」可调接口或前端本地追加，保证最终 20 个且含答案。
- **提示图**：
  - 占位区 +「AI生成图片」按钮：有提示词后点击，调 `POST /pun/cocreate/image/generate`（`type: "hint"`），展示返回的 `imageUrl`。
  - 可选：支持本地上传图片得到 URL 后填入。
- **答案图**：
  - 同上，「AI生成图片」传 `type: "answer"`，`prompt` 为答案解释。
- **提交关卡**：校验答案、选词 20 个、两张图 URL 均有值后，调用 `POST /pun/cocreate/submit`，成功后跳转列表或提示。

### 4.3 接口封装建议（与后端对齐）

- `api.generateCocreateWords(answer)` → POST `/pun/cocreate/words/generate`
- `api.generateCocreateImage(prompt, type)` → POST `/pun/cocreate/image/generate`，`type` 为 `hint` | `answer`
- `api.submitCocreate(data)` → POST `/pun/cocreate/submit`
- `api.getCocreateList(params)` → GET `/pun/cocreate/list`
- `api.getCocreateDetail(id)` → GET `/pun/cocreate/detail?id=`
- `api.submitCocreateAnswer(cocreateId, userAnswer)` → POST `/pun/cocreate/answer/submit`

### 4.4 与现有 play 的兼容

- `play.vue` 的 `onLoad` 中：若存在 `options.cocreateId`，调用 `getCocreateDetail(cocreateId)`，将返回的 `imageUrl`、`hintText`、`wordArray`、`answerLength`、`answer` 赋给现有 `puzzle` 结构；提交答案时调用 `submitCocreateAnswer(cocreateId, userAnswer)`。
- 若无 `cocreateId`，保持现有 `level` + `getLevelPuzzle(level)` 与 `submitAnswer(level, userAnswer)` 逻辑。

### 4.5 分享

- 玩共创页的分享 path 带 `cocreateId`：`/pages/play/play?cocreateId=123`，标题可写「这条谐音梗等你来猜」等。

---

## 五、联调与验收要点

| 项目       | 说明 |
|------------|------|
| 选词       | 20 个，且必须包含答案中的每个字；前后端校验一致。 |
| 图片生成   | 提示图、答案图可由后端统一调用 AI 绘图，返回 URL；前端只传文案。 |
| 提交校验   | 答案、选词、两张图 URL 必填；选词长度 20。 |
| 玩/分享    | 详情接口与现有题目结构对齐；分享链接带 `cocreateId` 可直达玩该关。 |

---

## 六、与主文档的对应关系

- 表结构：本节「二、表结构」；主文档《API_AND_DATABASE.md》可只保留共创表名与接口清单并引用本文档。
- 接口：本节「三」为完整定义；主文档中可列「7. 共创模块」并指向 **《COCREATE_FEATURE.md》**。
