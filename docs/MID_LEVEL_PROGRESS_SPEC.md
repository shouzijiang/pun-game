# 中级关卡进度与解锁规则（给后端的实现规范）

## 背景
当前系统把“初级关卡”和“中级关卡”都共用 `/pun/level/progress` 这一套进度接口、以及 `/pun/answer/submit` 这一套答题提交逻辑。

但中级关卡的 `level` id **不一定是连续整数**（例如 1000 直接跳到 2000），因此：
- 中级的“当前可玩/已通关/锁定”不能再用 `levelId` 的数值大小判断；
- 中级的解锁与通关推进必须以 `issue2.json` 中 `level` 的**有序列表索引**为准。

前端渲染三态需要后端返回中级的“索引类字段”（见下文字段定义）。

---

## 1. 接口一：`GET /pun/level/progress`

### 1.1 请求参数
- `gameTier`（可选）
  - `beginner`（或不传）=> 初级进度（保持兼容）
  - `mid` => 中级进度（新增字段）

### 1.2 初级返回（保持兼容，gameTier=beginner 或不传）
建议与现有前端一致：

```json
{
  "code": 200,
  "data": {
    "currentLevel": 20,
    "passedLevels": [1, 2, 3, "..."],
    "totalLevels": 270
  },
  "message": "success"
}
```

---

### 1.3 中级返回（gameTier=mid）
中级顺序以 `issue2.json` 的 `level` 列表顺序为准，记为：
- `midLevelIds = issue2.json 中所有 level 按出现顺序组成的数组`
- `midTotalLevels = midLevelIds.length`

前端需要用“有序索引”来生成三态格子，因此建议后端返回下列字段（二选一即可，推荐整套返回）：

#### 推荐返回字段（索引 + 对应 levelId）
```json
{
  "code": 200,
  "data": {
    "gameTier": "mid",
    "midTotalLevels": 1000,
    "midPassedCount": 37,
    "midCurrentIndex": 37,
    "midCurrentLevel": 2000,
    "midMaxLevel": 1500
  },
  "message": "success"
}
```

#### 字段定义
- `midTotalLevels`：中级题库条目数（midLevelIds 的长度）
- `midPassedCount`：已通关的数量（从索引 0 开始的前缀通关长度）
- `midCurrentIndex`：当前可玩格子的有序索引（0-based）。若已通关全部，建议返回 `null`
- `midCurrentLevel`：`midLevelIds[midCurrentIndex]`（若 `midCurrentIndex=null` 则为 `null`）
- `midMaxLevel`：玩家表中保存的 `pun_game_rank.max_mid_level`（仅用于回显/排查）

---

## 2. 中级进度计算（必须按 issue2.json 有序索引）

### 2.1 从数据库读玩家状态
- 读取 `pun_game_rank.max_mid_level`（你表中已存在）
- 记为 `storedMaxLevelId`

### 2.2 构建中级有序列表
- 加载并缓存 `issue2.json`
- 生成 `midLevelIds`

### 2.3 计算通关前缀长度与当前可玩
求：
- `storedIdx = midLevelIds.indexOf(storedMaxLevelId)`
  - 若不存在，则 `storedIdx = -1`

则：
- `midPassedCount = storedIdx + 1`
- `midCurrentIndex = midPassedCount`（即下一条）
  - 若 `midCurrentIndex >= midTotalLevels` => 已通关全部，`midCurrentIndex = null`
- `midCurrentLevel = midLevelIds[midCurrentIndex]`（若 `midCurrentIndex=null` 则为 `null`）

> 注意：**整个计算过程不要按数字大小排序**，必须使用 issue2.json 的原始顺序。

---

## 3. 接口二：`POST /pun/answer/submit`（答题提交）

### 3.1 请求体
前端在中级答题时会在 body 里携带：
- `gameTier: "mid"`

因此后端需要在判定逻辑里区分 `gameTier`：
- `gameTier=beginner`（或不传）：按原初级逻辑更新 `pun_game_rank.max_level` 与 `pun_game_level_progress`
- `gameTier=mid`：按本规范更新 `pun_game_rank.max_mid_level`

### 3.2 中级正确时的推进规则（防止跳关）
当判定 `isCorrect=true` 且 `gameTier=mid` 时：

1. 构建 `midLevelIds`（issue2.json 顺序）
2. 找到玩家当前 stored 状态的索引：
   - `storedIdx = midLevelIds.indexOf(pun_game_rank.max_mid_level)`
   - 不存在 => `storedIdx = -1`
3. 找到本次提交 level 的索引：
   - `submitIdx = midLevelIds.indexOf(level)`
4. 仅当满足“前缀下一关”时才推进：
   - 若 `submitIdx === storedIdx + 1`：
     - 更新 `max_mid_level = level`
   - 否则：
     - 不更新（用于防止玩家提交后续关导致的“前缀不一致”）

---

## 4. 兼容性与验收清单

### 4.1 兼容性
- `GET /pun/level/progress` 不传 `gameTier` 时，返回初级旧结构不变；
- `GET /pun/level/progress?gameTier=mid` 才返回 mid 专属字段。

### 4.2 验收点（建议后端自测）
1. `issue2.json` 中存在非连续 level id（例如 1000->2000），确保中级的 `midCurrentLevel` 能正确跳到下一条真实存在的 level；
2. 玩家在中级提交正确答案时：
   - 只有当提交的是“下一条真实存在的 level”才推进；
   - 提交跳过后的正确答案不推进（避免解锁与前缀不一致）。

