/**
 * 游戏 BGM / 音效
 *
 * - 微信小程序：BGM 使用 wx.getBackgroundAudioManager（后台可继续播，需设置 title 等元信息）
 * - 通关短音效：仍用 InnerAudioContext，与背景音乐并行，不替换 BGM 的 src
 * - 其他端：BGM 与音效均用 uni.createInnerAudioContext
 */

const STORAGE_KEY = 'pun_game_bgm_enabled'

const BGM_HOME = 'https://sofun.online/static/punGame/mp3/BGMMain.wav'
const BGM_PLAY = 'https://sofun.online/static/punGame/mp3/BGMGame1.wav'
const SFX_CONGRATS = 'https://sofun.online/static/punGame/mp3/SFXCongrats.wav'

/** 微信背景音频必填元信息（锁屏/控制台展示，部分机型不设可能影响播放） */
const WX_BGM_META = {
  title: '谐音梗猜一猜',
  epname: '背景音乐',
  singer: '休闲小游戏',
}

let bgmCtx = null
let sfxCongratsCtx = null
let currentBgmUrl = ''

// #ifdef MP-WEIXIN
let wxBgmEndedHooked = false

function hookWxBackgroundBgmLoop() {
  if (wxBgmEndedHooked) return
  wxBgmEndedHooked = true
  try {
    const bgm = wx.getBackgroundAudioManager()
    bgm.onEnded(() => {
      if (!isGameAudioEnabled() || !currentBgmUrl) return
      try {
        bgm.title = WX_BGM_META.title
        bgm.epname = WX_BGM_META.epname
        bgm.singer = WX_BGM_META.singer
        bgm.src = currentBgmUrl
      } catch (e) {
        console.warn('[gameAudio] wx bgm onEnded relaunch', e)
      }
    })
    bgm.onError((err) => {
      console.warn('[gameAudio] wx BackgroundAudioManager error', err)
    })
  } catch (e) {
    console.warn('[gameAudio] hook wx bgm failed', e)
  }
}

function playBgmWx(url) {
  hookWxBackgroundBgmLoop()
  if (!isGameAudioEnabled()) return
  try {
    const bgm = wx.getBackgroundAudioManager()
    currentBgmUrl = url
    bgm.title = WX_BGM_META.title
    bgm.epname = WX_BGM_META.epname
    bgm.singer = WX_BGM_META.singer
    bgm.src = url
    // 文档：设置 src 后会自动播放；部分机型再补一次 play
    try {
      bgm.play()
    } catch (e) {
      /* noop */
    }
  } catch (e) {
    console.warn('[gameAudio] wx playBgm failed', e)
  }
}

function stopBgmWx() {
  currentBgmUrl = ''
  try {
    wx.getBackgroundAudioManager().stop()
  } catch (e) {
    /* noop */
  }
}
// #endif

function applyCtxDefaults(ctx, loop) {
  ctx.loop = !!loop
  try {
    if (typeof ctx.volume === 'number') {
      ctx.volume = 1
    }
  } catch (e) {
    /* noop */
  }
  // #ifdef MP
  try {
    if ('obeyMuteSwitch' in ctx) {
      ctx.obeyMuteSwitch = false
    }
  } catch (e) {
    /* noop */
  }
  // #endif
}

export function isGameAudioEnabled() {
  try {
    const v = uni.getStorageSync(STORAGE_KEY)
    if (v === '' || v === undefined || v === null) return true
    return v === true || v === 'true' || v === 1 || v === '1'
  } catch {
    return true
  }
}

/**
 * @param {boolean} on
 */
export function setGameAudioEnabled(on) {
  uni.setStorageSync(STORAGE_KEY, !!on)
  if (!on) {
    stopBgm()
    stopCongratsSfx()
  }
}

function getBgmContextInner() {
  if (!bgmCtx) {
    bgmCtx = uni.createInnerAudioContext()
    applyCtxDefaults(bgmCtx, true)
  }
  return bgmCtx
}

function getCongratsContext() {
  if (!sfxCongratsCtx) {
    sfxCongratsCtx = uni.createInnerAudioContext()
    applyCtxDefaults(sfxCongratsCtx, false)
  }
  return sfxCongratsCtx
}

function safePlay(ctx) {
  try {
    ctx.play()
  } catch (e) {
    console.warn('[gameAudio] play error', e)
  }
}

function playWhenReady(ctx, playFn) {
  const kick = () => playFn()
  kick()
  setTimeout(kick, 120)
  setTimeout(kick, 360)
  setTimeout(kick, 800)
  try {
    if (typeof ctx.onCanplay === 'function') {
      const onReady = () => {
        try {
          if (typeof ctx.offCanplay === 'function') {
            ctx.offCanplay(onReady)
          }
        } catch (e) {
          /* noop */
        }
        kick()
      }
      try {
        if (typeof ctx.offCanplay === 'function') {
          ctx.offCanplay(onReady)
        }
      } catch (e) {
        /* noop */
      }
      ctx.onCanplay(onReady)
    }
  } catch (e) {
    /* noop */
  }
}

function playBgmInner(url) {
  if (!isGameAudioEnabled()) return
  const ctx = getBgmContextInner()
  applyCtxDefaults(ctx, true)

  if (currentBgmUrl === url) {
    playWhenReady(ctx, () => safePlay(ctx))
    return
  }

  currentBgmUrl = url
  try {
    ctx.stop()
  } catch (e) {
    /* noop */
  }
  ctx.src = url
  playWhenReady(ctx, () => safePlay(ctx))
}

function playBgm(url) {
  if (!isGameAudioEnabled()) return
  // #ifdef MP-WEIXIN
  playBgmWx(url)
  // #endif
  // #ifndef MP-WEIXIN
  playBgmInner(url)
  // #endif
}

export function playBgmHome() {
  playBgm(BGM_HOME)
}

export function playBgmPlay() {
  playBgm(BGM_PLAY)
}

export function stopBgm() {
  // #ifdef MP-WEIXIN
  stopBgmWx()
  // #endif
  // #ifndef MP-WEIXIN
  currentBgmUrl = ''
  if (!bgmCtx) return
  try {
    bgmCtx.stop()
  } catch (e) {
    /* noop */
  }
  // #endif
}

export function playCongratsOnce() {
  if (!isGameAudioEnabled()) return
  const ctx = getCongratsContext()
  applyCtxDefaults(ctx, false)
  try {
    ctx.stop()
  } catch (e) {
    /* noop */
  }
  ctx.src = SFX_CONGRATS
  playWhenReady(ctx, () => safePlay(ctx))
}

function stopCongratsSfx() {
  if (!sfxCongratsCtx) return
  try {
    sfxCongratsCtx.stop()
  } catch (e) {
    /* noop */
  }
}
