import { request } from '../utils/request'

/**
 * 关卡与题目数据（示例），后续可改为从 https://apaas.aiforce.cloud 接口拉取
 */
export const LEVELS_PER_PAGE = 40

const STORAGE_CURRENT = 'pun_game_current_level'
const STORAGE_PASSED = 'pun_game_passed_levels'

export function getCurrentLevel() {
  try {
    const n = uni.getStorageSync(STORAGE_CURRENT)
    return n ? parseInt(n, 10) : 1
  } catch {
    return 1
  }
}

export function setCurrentLevel(level) {
  try {
    uni.setStorageSync(STORAGE_CURRENT, String(level))
  } catch (e) {}
}

export function getPassedLevels() {
  try {
    const raw = uni.getStorageSync(STORAGE_PASSED)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function addPassedLevel(level) {
  const passed = getPassedLevels()
  if (passed.includes(level)) return
  passed.push(level)
  passed.sort((a, b) => a - b)
  try {
    uni.setStorageSync(STORAGE_PASSED, JSON.stringify(passed))
  } catch (e) {}
}

export function isLevelPassed(level) {
  return getPassedLevels().includes(level)
}

const LEVEL_DATA_BASE = 'https://sofun.online/static/punGame/issue'
/** 中级题库总表（每一条里带 question/answer/answerType 等） */
const MID_ISSUE_URL = 'https://sofun.online/static/punGame/issue2.json'
/** 中级题目图片：w{level}-1 为上图，w{level}-2 为下图 */
const MID_IMAGE_BASE = 'https://sofun.online/static/punGame/img2'

const FALLBACK_PUZZLE = {
  hintText: '题库加载失败，请稍后重试',
  topCaption: '',
  bottomCaption: '',
  keywordHint: '',
  wordArray: ['测', '试', '题'],
  answerLength: 3,
  imageUrl: '',
  imageUrlTop: '',
  imageUrlBottom: '',
  isReviewMode: false,
  answer: '',
}

let midIssueCache = null
let midIssuePromise = null
let midMaxLevel = null
let midLevels = null

function normalizePuzzle(data) {
  const answerLength = Math.max(1, parseInt(data.answerLength, 10) || 3)
  return {
    hintText: data.hintText || '',
    topCaption: data.topCaption || '',
    bottomCaption: data.bottomCaption || '',
    keywordHint: data.keywordHint || data.category || '',
    wordArray: Array.isArray(data.wordArray) ? data.wordArray : [],
    answerLength,
    imageUrl: data.imageUrl || '',
    imageUrlTop: data.imageUrlTop || data.image_url_top || '',
    imageUrlBottom: data.imageUrlBottom || data.image_url_bottom || '',
    isReviewMode: !!data.isReviewMode,
    answer: data.answer != null ? String(data.answer).trim() : '',
  }
}

/**
 * 初级关卡题目：{ hintText, wordArray, answerLength, imageUrl, imageUrlTop?, imageUrlBottom?, keywordHint?, topCaption?, bottomCaption?, ... }
 */
export function getLevelPuzzle(levelNum) {
  const url = `${LEVEL_DATA_BASE}/${levelNum}.json`
  return request({ url, method: 'GET' })
    .then((res) => (res.data && normalizePuzzle(res.data)))
    .catch(() => ({ ...FALLBACK_PUZZLE }))
}

function fetchMidIssues() {
  if (midIssueCache) return Promise.resolve(midIssueCache)
  if (midIssuePromise) return midIssuePromise

  midIssuePromise = request({ url: MID_ISSUE_URL, method: 'GET' })
    .then((res) => {
      const list = Array.isArray(res.data) ? res.data : []
      midIssueCache = list
      const levels = list
        .map((it) => (it && it.level != null ? parseInt(it.level, 10) : NaN))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b)

      midLevels = Array.from(new Set(levels))
      const max = midLevels.length ? midLevels[midLevels.length - 1] : 0
      midMaxLevel = max || 0
      return list
    })
    .catch(() => {
      midIssueCache = []
      midMaxLevel = 0
      midLevels = []
      return []
    })

  return midIssuePromise
}

export function getMidMaxLevel() {
  return midMaxLevel || 0
}

export function getMidLevelList() {
  return Array.isArray(midLevels) ? midLevels : []
}

/**
 * 中级：确保 issue2.json 的中级关卡列表已加载完成
 * 用于“我的关卡”这种需要完整列表渲染的场景。
 */
export async function loadMidLevelList() {
  await fetchMidIssues()
  return getMidLevelList()
}

/**
 * 根据 /pun/level/progress?gameTier=mid 的返回，解析当前应玩的真实关卡 level（issue2 中的 level 数字）。
 * 仅使用统一字段 currentLevel；缺失时回退到中级列表第一关。
 */
export function pickMidLevelFromProgress(data, orderedLevels) {
  const list = Array.isArray(orderedLevels) ? orderedLevels : getMidLevelList()
  if (!data) return list.length ? list[0] : null

  const lv = data.currentLevel != null ? Number(data.currentLevel) : null
  if (Number.isFinite(lv) && list.includes(lv)) return lv

  return list.length ? list[0] : null
}

/**
 * 中级：获取当前 level 的“下一个真实存在的 level”（与 issue2.json 完全一致）
 */
export function getMidNextLevel(levelNum) {
  const current = parseInt(levelNum, 10)
  return fetchMidIssues().then(() => {
    const levels = getMidLevelList()
    const idx = levels.indexOf(current)
    if (idx < 0) return null
    return idx + 1 < levels.length ? levels[idx + 1] : null
  })
}

/**
 * 中级：从 issue2.json 中找到 level 对应条目，并拼出上下两张图
 */
export function getMidLevelPuzzle(levelNum) {
  const lv = parseInt(levelNum, 10)
  return fetchMidIssues().then((list) => {
    const item = list.find((x) => x && parseInt(x.level, 10) === lv)
    if (!item) {
      return { ...FALLBACK_PUZZLE, answerLength: 3, keywordHint: '', imageUrlTop: '', imageUrlBottom: '' }
    }

    const answerLength = Math.max(1, parseInt(item.answerLength, 10) || 3)
    return normalizePuzzle({
      hintText: item.tips || '',
      topCaption: item.question ? `这是${item.question}` : '',
      bottomCaption: `这是${'_'.repeat(answerLength)}`,
      keywordHint: item.answerType || '',
      wordArray: [],
      answerLength,
      imageUrlTop: `${MID_IMAGE_BASE}/w${lv}-1.png`,
      imageUrlBottom: `${MID_IMAGE_BASE}/w${lv}-2.png`,
      isReviewMode: false,
      answer: item.answer != null ? String(item.answer).trim() : '',
    })
  })
}
