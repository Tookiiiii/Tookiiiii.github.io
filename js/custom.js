(() => {
  const tracks = [
    {
      title: 'Cyber Rain',
      meta: '合成器 / 夜间学习',
      src: '/audio/cyber-rain.wav'
    },
    {
      title: 'Study Pulse',
      meta: '轻节拍 / 写作模式',
      src: '/audio/study-pulse.wav'
    },
    {
      title: 'Night Drive',
      meta: '低频氛围 / 浏览模式',
      src: '/audio/night-drive.wav'
    }
  ]

  const storage = {
    track: 'tooki.music.track',
    volume: 'tooki.music.volume',
    boot: 'tooki.boot.seen'
  }

  const readLocal = key => {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      return null
    }
  }

  let audio
  let currentTrack = Math.min(Math.max(Number(readLocal(storage.track)) || 0, 0), tracks.length - 1)

  const ready = fn => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn, { once: true })
      return
    }
    fn()
  }

  const save = (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      return undefined
    }
  }

  const readSession = key => {
    try {
      return sessionStorage.getItem(key)
    } catch (error) {
      return null
    }
  }

  const saveSession = (key, value) => {
    try {
      sessionStorage.setItem(key, value)
    } catch (error) {
      return undefined
    }
  }

  const createIcon = name => `<i class="fa-fw fas ${name}"></i>`

  const getVolume = () => {
    const stored = Number(readLocal(storage.volume))
    return Number.isFinite(stored) ? stored : 0.42
  }

  const syncTrackCards = () => {
    document.querySelectorAll('[data-tooki-track]').forEach(card => {
      card.classList.toggle('is-active', Number(card.dataset.tookiTrack) === currentTrack)
    })
  }

  const updateDock = () => {
    const dock = document.getElementById('tooki-music-dock')
    if (!dock) return

    const track = tracks[currentTrack]
    const title = dock.querySelector('.tooki-music-title')
    const meta = dock.querySelector('.tooki-music-meta')
    const toggle = dock.querySelector('.tooki-music-toggle')

    if (title) title.textContent = track.title
    if (meta) meta.textContent = audio && !audio.paused ? `Playing · ${track.meta}` : track.meta
    if (toggle) {
      toggle.innerHTML = audio && !audio.paused ? createIcon('fa-pause') : createIcon('fa-play')
      toggle.setAttribute('aria-label', audio && !audio.paused ? '暂停音乐' : '播放音乐')
    }

    syncTrackCards()
  }

  const ensureAudio = () => {
    if (audio) return audio

    audio = new Audio(tracks[currentTrack].src)
    audio.loop = true
    audio.preload = 'none'
    audio.volume = getVolume()
    audio.addEventListener('play', updateDock)
    audio.addEventListener('pause', updateDock)
    audio.addEventListener('ended', () => switchTrack((currentTrack + 1) % tracks.length, true))
    return audio
  }

  const playCurrent = () => {
    const player = ensureAudio()
    player.play().then(updateDock).catch(() => {
      const dock = document.getElementById('tooki-music-dock')
      const meta = dock && dock.querySelector('.tooki-music-meta')
      if (meta) meta.textContent = '浏览器拦截了自动播放，请再点一次'
    })
  }

  const switchTrack = (index, shouldPlay = false) => {
    currentTrack = (index + tracks.length) % tracks.length
    save(storage.track, String(currentTrack))

    if (audio) {
      const wasPlaying = shouldPlay || !audio.paused
      audio.pause()
      audio.src = tracks[currentTrack].src
      audio.load()
      audio.volume = getVolume()
      if (wasPlaying) playCurrent()
    }

    updateDock()
  }

  const initMusicDock = () => {
    if (document.getElementById('tooki-music-dock')) {
      updateDock()
      return
    }

    const dock = document.createElement('div')
    dock.id = 'tooki-music-dock'
    dock.className = 'tooki-music-dock'
    dock.innerHTML = `
      <button class="tooki-music-toggle" type="button" aria-label="播放音乐">${createIcon('fa-play')}</button>
      <div class="tooki-music-info">
        <div class="tooki-music-title"></div>
        <div class="tooki-music-meta"></div>
      </div>
      <button class="tooki-music-next" type="button" aria-label="下一首">${createIcon('fa-forward-step')}</button>
      <input class="tooki-music-volume" type="range" min="0" max="1" step="0.01" aria-label="音乐音量">
    `
    document.body.appendChild(dock)

    const volume = dock.querySelector('.tooki-music-volume')
    volume.value = String(getVolume())

    dock.querySelector('.tooki-music-toggle').addEventListener('click', () => {
      const player = ensureAudio()
      if (player.paused) {
        playCurrent()
      } else {
        player.pause()
      }
    })

    dock.querySelector('.tooki-music-next').addEventListener('click', () => {
      switchTrack(currentTrack + 1, audio && !audio.paused)
    })

    volume.addEventListener('input', event => {
      const nextVolume = Number(event.target.value)
      save(storage.volume, String(nextVolume))
      if (audio) audio.volume = nextVolume
    })

    updateDock()
  }

  const initBoot = () => {
    if (readSession(storage.boot) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (document.querySelector('.tooki-boot')) return

    const boot = document.createElement('div')
    boot.className = 'tooki-boot'
    boot.innerHTML = `
      <div class="tooki-boot-card">
        <div class="tooki-boot-title">TOOKI BLOG</div>
        <p class="tooki-boot-subtitle">Loading notes, links and study mode.</p>
        <div class="tooki-boot-bar"><span></span></div>
        <button class="tooki-boot-skip" type="button">进入博客</button>
      </div>
    `
    document.body.appendChild(boot)

    const hide = () => {
      boot.classList.add('is-hide')
      saveSession(storage.boot, '1')
      window.setTimeout(() => boot.remove(), 520)
    }

    boot.querySelector('.tooki-boot-skip').addEventListener('click', hide)
    window.setTimeout(hide, 1700)
  }

  const initReveal = () => {
    const targets = document.querySelectorAll('.recent-post-item, .card-widget, .tooki-section, .tooki-card, #archive, #page, #post')
    if (!('IntersectionObserver' in window)) {
      targets.forEach(target => target.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.08 })

    targets.forEach(target => {
      if (target.dataset.tookiReveal === '1') return
      target.dataset.tookiReveal = '1'
      target.classList.add('tooki-reveal')
      observer.observe(target)
    })
  }

  const initTrackCards = () => {
    if (document.documentElement.dataset.tookiTrackBound === '1') {
      syncTrackCards()
      return
    }

    document.documentElement.dataset.tookiTrackBound = '1'
    document.addEventListener('click', event => {
      const trigger = event.target.closest('[data-tooki-track]')
      if (!trigger) return
      switchTrack(Number(trigger.dataset.tookiTrack), true)
    })

    syncTrackCards()
  }

  const init = () => {
    initBoot()
    initMusicDock()
    initReveal()
    initTrackCards()
  }

  ready(init)
  document.addEventListener('pjax:complete', init)
})()
