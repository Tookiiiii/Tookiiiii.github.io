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

  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char])

  const initTypewriter = () => {
    const siteInfo = document.getElementById('site-info')
    if (!siteInfo || document.querySelector('.tooki-typewriter')) return

    const subtitle = document.createElement('div')
    subtitle.className = 'tooki-typewriter'
    subtitle.innerHTML = '<span class="tooki-typewriter-text"></span><span class="tooki-typewriter-cursor">|</span>'
    siteInfo.appendChild(subtitle)

    const phrases = ['CTF / Blog / Study Notes', '记录搭建，也记录折腾', 'So Futuristic Player!']
    const textNode = subtitle.querySelector('.tooki-typewriter-text')
    let phraseIndex = 0
    let charIndex = 0
    let deleting = false

    const tick = () => {
      if (!document.body.contains(subtitle)) return
      const phrase = phrases[phraseIndex]
      textNode.textContent = phrase.slice(0, charIndex)

      if (!deleting && charIndex < phrase.length) {
        charIndex += 1
        window.setTimeout(tick, 85)
        return
      }

      if (!deleting && charIndex === phrase.length) {
        deleting = true
        window.setTimeout(tick, 1600)
        return
      }

      if (deleting && charIndex > 0) {
        charIndex -= 1
        window.setTimeout(tick, 42)
        return
      }

      deleting = false
      phraseIndex = (phraseIndex + 1) % phrases.length
      window.setTimeout(tick, 280)
    }

    tick()
  }

  const initSearch = () => {
    if (document.getElementById('tooki-search-mask')) return

    const rightside = document.getElementById('rightside-config-show')
    if (rightside && !document.getElementById('tooki-search-button')) {
      const button = document.createElement('button')
      button.id = 'tooki-search-button'
      button.type = 'button'
      button.title = '站内搜索'
      button.innerHTML = createIcon('fa-magnifying-glass')
      rightside.insertBefore(button, rightside.firstChild)
    }

    const mask = document.createElement('div')
    mask.id = 'tooki-search-mask'
    mask.className = 'tooki-search-mask'
    mask.innerHTML = `
      <div class="tooki-search-panel" role="dialog" aria-modal="true" aria-label="站内搜索">
        <div class="tooki-search-head">
          <input class="tooki-search-input" type="search" placeholder="搜索文章标题或内容，支持 Ctrl + K" autocomplete="off">
          <button class="tooki-search-close" type="button" aria-label="关闭搜索">${createIcon('fa-xmark')}</button>
        </div>
        <div class="tooki-search-results"><div class="tooki-search-empty">输入关键词开始搜索</div></div>
      </div>
    `
    document.body.appendChild(mask)

    const input = mask.querySelector('.tooki-search-input')
    const results = mask.querySelector('.tooki-search-results')
    let index = []
    let loading

    const loadIndex = () => {
      if (!loading) {
        loading = fetch('/search.json?v=20260428-search-comment')
          .then(response => response.ok ? response.json() : [])
          .then(data => {
            index = Array.isArray(data) ? data : []
            return index
          })
          .catch(() => {
            index = []
            return index
          })
      }
      return loading
    }

    const render = query => {
      const keyword = query.trim().toLowerCase()
      if (!keyword) {
        results.innerHTML = '<div class="tooki-search-empty">输入关键词开始搜索</div>'
        return
      }

      const matched = index
        .map(item => {
          const title = item.title || ''
          const content = item.content || ''
          const haystack = `${title} ${content}`.toLowerCase()
          const score = (title.toLowerCase().includes(keyword) ? 2 : 0) + (haystack.includes(keyword) ? 1 : 0)
          return { item, score }
        })
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)

      if (!matched.length) {
        results.innerHTML = '<div class="tooki-search-empty">没搜到，换个关键词试试</div>'
        return
      }

      results.innerHTML = matched.map(({ item }) => {
        const content = item.content || ''
        const lower = content.toLowerCase()
        const at = Math.max(lower.indexOf(keyword), 0)
        const excerpt = content.slice(Math.max(0, at - 36), at + 120)
        return `
          <a class="tooki-search-item" href="${escapeHtml(item.url)}">
            <div class="tooki-search-title">${escapeHtml(item.title)}</div>
            <div class="tooki-search-meta">${escapeHtml(item.date || '')}</div>
            <div class="tooki-search-excerpt">${escapeHtml(excerpt)}...</div>
          </a>
        `
      }).join('')
    }

    const open = () => {
      mask.classList.add('is-open')
      loadIndex().then(() => render(input.value))
      window.setTimeout(() => input.focus(), 0)
    }

    const close = () => {
      mask.classList.remove('is-open')
    }

    document.getElementById('tooki-search-button')?.addEventListener('click', open)
    mask.querySelector('.tooki-search-close').addEventListener('click', close)
    mask.addEventListener('click', event => {
      if (event.target === mask) close()
    })
    input.addEventListener('input', event => render(event.target.value))
    document.addEventListener('keydown', event => {
      const target = event.target
      const isTyping = target && ['INPUT', 'TEXTAREA'].includes(target.tagName)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        open()
      } else if (!isTyping && event.key === '/') {
        event.preventDefault()
        open()
      } else if (event.key === 'Escape') {
        close()
      }
    })
  }

  const initComments = () => {
    const post = document.getElementById('post')
    if (!post || document.getElementById('tooki-comments')) return

    const section = document.createElement('section')
    section.id = 'tooki-comments'
    section.className = 'tooki-comment-section'
    section.innerHTML = `
      <div class="tooki-comment-head">
        <div class="tooki-kicker">Comments</div>
        <h2>评论区</h2>
        <p>使用 GitHub Issues 承载评论。首次加载可能需要几秒；如果提示未安装，需要给仓库安装 utterances。</p>
      </div>
      <div class="tooki-comment-body"></div>
    `
    post.insertAdjacentElement('afterend', section)

    const script = document.createElement('script')
    script.src = 'https://utteranc.es/client.js'
    script.async = true
    script.setAttribute('repo', 'Tookiiiii/Tookiiiii.github.io')
    script.setAttribute('issue-term', 'pathname')
    script.setAttribute('label', 'comment')
    script.setAttribute('theme', document.documentElement.getAttribute('data-theme') === 'dark' ? 'github-dark' : 'github-light')
    script.setAttribute('crossorigin', 'anonymous')
    section.querySelector('.tooki-comment-body').appendChild(script)
  }

  const initFriendRandom = () => {
    const button = document.getElementById('tooki-random-friend')
    if (!button || button.dataset.bound === '1') return
    button.dataset.bound = '1'
    button.addEventListener('click', () => {
      const links = Array.from(document.querySelectorAll('.flink-list-item a[href]'))
        .map(link => link.href)
        .filter(link => link && !link.includes('tookiiiii.github.io'))
      if (!links.length) return
      window.open(links[Math.floor(Math.random() * links.length)], '_blank', 'noopener')
    })
  }

  const init = () => {
    initBoot()
    initMusicDock()
    initReveal()
    initTrackCards()
    initTypewriter()
    initSearch()
    initComments()
    initFriendRandom()
  }

  ready(init)
  document.addEventListener('pjax:complete', init)
})()
