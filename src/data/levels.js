import { request } from '../utils/request'

/**
 * 关卡与题目数据（示例），后续可改为从 https://apaas.aiforce.cloud 接口拉取
 */
export const LEVELS_PER_PAGE = 40
export const TOTAL_LEVELS = 253

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

function normalizePuzzle(data) {
  return {
    hintText: data.hintText || '',
    wordArray: Array.isArray(data.wordArray) ? data.wordArray : [],
    answerLength: Math.max(1, parseInt(data.answerLength, 10) || 3),
    imageUrl: data.imageUrl || '',
    isReviewMode: !!data.isReviewMode,
    answer: data.answer != null ? String(data.answer).trim() : '',
  }
}

/**
 * 关卡题目结构：{ level, hintText, wordArray, answerLength, imageUrl, isReviewMode, answer? }
 * 共 253 关，对应 1.json ~ 253.json
 */
export function getLevelPuzzle(levelNum) {
  const url = `${LEVEL_DATA_BASE}/${levelNum}.json`
  return request({ url, method: 'GET' })
    .then((res) => (res.data && normalizePuzzle(res.data)))
    .catch(() => FALLBACK_PUZZLE)
}
