import './style.css'

const WHATSAPP_NUMBER = '2347043079022'
const GOOGLE_SHEET_ID = '1437oGWma9aylKVl59xohclaREudnsvO8TZjGS4LDg8Y'
const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=csv`
const LOCAL_CSV_PATH = '/assets/contestants.csv'
const VOTES_KEY = 'adamaway_votes'
const VOTE_COUNT_KEY = 'adamaway_vote_counts'

export async function loadContestants() {
  // 1. Try Live Google Sheet (instant score updates from admin)
  try {
    const res = await fetch(`${GOOGLE_SHEET_CSV_URL}&_t=${Date.now()}`)
    if (res.ok) {
      const text = await res.text()
      if (text && !text.includes('<!doctype html>') && !text.includes('<html') && text.includes('name')) {
        const parsed = parseCSV(text)
        if (parsed.length > 0) {
          return parsed
        }
      }
    }
  } catch (e) {
    console.warn('Google Sheet fetch error, falling back to local CSV:', e)
  }

  // 2. Fallback to bundled local CSV
  try {
    const res = await fetch(LOCAL_CSV_PATH)
    if (!res.ok) throw new Error('Failed to load local CSV')
    const text = await res.text()
    return parseCSV(text)
  } catch (e) {
    console.error('Failed to load contestants:', e)
    return []
  }
}

function parseCSV(text) {
  const lines = text.trim().split('\n')
  const headers = parseCSVLine(lines[0])
  const rows = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((h, idx) => {
      const key = h.trim()
      if (key) {
        row[key] = (values[idx] || '').trim()
      }
    })
    row.votes = parseInt(row.votes) || 0
    rows.push(row)
  }

  return rows.sort((a, b) => b.votes - a.votes)
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}


export function getLocalVotes() {
  try {
    const stored = localStorage.getItem(VOTES_KEY)
    return new Set(stored ? JSON.parse(stored) : [])
  } catch {
    return new Set()
  }
}

export function saveLocalVote(name) {
  const votes = getLocalVotes()
  votes.add(name)
  localStorage.setItem(VOTES_KEY, JSON.stringify([...votes]))
}

export function getStoredVoteCounts() {
  try {
    const stored = localStorage.getItem(VOTE_COUNT_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function saveStoredVoteCounts(counts) {
  localStorage.setItem(VOTE_COUNT_KEY, JSON.stringify(counts))
}

export function getMergedContestants(baseContestants) {
  const storedCounts = getStoredVoteCounts()
  return baseContestants.map((c) => ({
    ...c,
    votes: (storedCounts[c.name] !== undefined ? storedCounts[c.name] : c.votes),
  })).sort((a, b) => b.votes - a.votes)
}

export function getMaxVotes(contestants) {
  return Math.max(...contestants.map((c) => c.votes), 1)
}

export function renderStats(contestants) {
  const totalVotes = contestants.reduce((sum, c) => sum + c.votes, 0)
  const elContestants = document.getElementById('stat-contestants')
  const elVotes = document.getElementById('stat-votes')
  if (elContestants) elContestants.textContent = contestants.length
  if (elVotes) elVotes.textContent = totalVotes.toLocaleString()
}

let toastTimer = null
export function showToast(message, type = 'success') {
  const toast = document.getElementById('toast')
  if (!toast) return
  toast.className = `toast ${type}`
  toast.innerHTML = `<span class="toast-icon">${type === 'success' ? '✓' : '✕'}</span><span>${message}</span>`
  toast.classList.add('show')

  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toast.classList.remove('show')
  }, 3500)
}

export function setupNavbar() {
  const navbar = document.getElementById('navbar')
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40)
    })
  }

  // Hamburger & Mobile Menu Handling
  const hamburger = document.getElementById('navbar-hamburger')
  const mobileMenu = document.getElementById('navbar-mobile-menu')

  if (hamburger && mobileMenu) {
    const closeMobileMenu = () => {
      mobileMenu.classList.remove('open')
      hamburger.classList.remove('active')
      hamburger.setAttribute('aria-expanded', 'false')
      hamburger.innerHTML = '<i data-lucide="menu"></i>'
      if (window.lucide) window.lucide.createIcons()
    }

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation()
      const isOpen = mobileMenu.classList.toggle('open')
      hamburger.classList.toggle('active', isOpen)
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false')
      hamburger.innerHTML = isOpen ? '<i data-lucide="x"></i>' : '<i data-lucide="menu"></i>'
      if (window.lucide) window.lucide.createIcons()
    })

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu)
    })

    document.addEventListener('click', (e) => {
      if (navbar && !navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
        if (mobileMenu.classList.contains('open')) {
          closeMobileMenu()
        }
      }
    })

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMobileMenu()
      }
    })
  }

  document.querySelectorAll('.navbar-links a').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href')
      if (href && href.startsWith('#')) {
        e.preventDefault()
        const target = document.querySelector(href)
        if (target) target.scrollIntoView({ behavior: 'smooth' })
      }
    })
  })

  const navCta = document.getElementById('nav-cta')
  if (navCta) {
    navCta.addEventListener('click', () => {
      window.location.href = '/contestants.html'
    })
  }

  if (window.lucide) {
    window.lucide.createIcons()
  }
}

export function showVoteConfirmModal(contestant) {
  const existing = document.getElementById('vote-confirm-modal')
  if (existing) existing.remove()

  const modal = document.createElement('div')
  modal.id = 'vote-confirm-modal'
  modal.className = 'vote-modal-overlay'
  modal.innerHTML = `
    <div class="vote-modal">
      <button class="vote-modal-close" id="vote-modal-close" aria-label="Close modal">&#x2715;</button>
      
      <div class="vote-modal-contestant">
        <img src="${contestant.photo}" alt="${contestant.name}" class="vote-modal-photo" />
        <div class="vote-modal-contestant-info">
          <div class="vote-modal-badge">OFFICIAL CONTESTANT</div>
          <div class="vote-modal-subtitle">No. ${contestant.number || ''} &middot; ${contestant.lga || ''} LGA</div>
          <h2 class="vote-modal-title"><span>${contestant.name}</span></h2>
          ${contestant.bio ? `<p class="vote-modal-quote">&ldquo;${contestant.bio}&rdquo;</p>` : ''}
        </div>
      </div>

      <div class="vote-modal-body">
        <p class="vote-modal-instruction">
          Transfer <strong>&#x20A6;100</strong> per vote to the official Sterling Bank account below, then tap <strong>Send Proof on WhatsApp</strong> to submit your receipt.
        </p>
        <div class="vote-payment-box">
          <div class="vote-payment-row">
            <span class="vote-payment-label">Bank</span>
            <span class="vote-payment-value">Sterling Bank</span>
          </div>
          <div class="vote-payment-row">
            <span class="vote-payment-label">Account No.</span>
            <span class="vote-payment-value acct-num">0093415813</span>
          </div>
          <div class="vote-payment-row">
            <span class="vote-payment-label">Account Name</span>
            <span class="vote-payment-value">Adamawa Lens Battle</span>
          </div>
          <div class="vote-payment-row vote-payment-cost">
            <span class="vote-payment-label">Voting Cost</span>
            <span class="vote-payment-value gold">&#x20A6;100 per vote</span>
          </div>
        </div>
        <p class="vote-modal-note">
          <i data-lucide="info"></i>
          Multiple votes allowed. Each &#x20A6;100 transferred = 1 verified vote.
        </p>
      </div>

      <div class="vote-modal-actions">
        <button class="vote-modal-cancel" id="vote-modal-cancel">Cancel</button>
        <button class="vote-modal-confirm" id="vote-modal-confirm">
          <i data-lucide="message-circle"></i>
          Send Proof on WhatsApp
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  if (window.lucide) window.lucide.createIcons()
  requestAnimationFrame(() => modal.classList.add('active'))

  const closeModal = () => {
    modal.classList.remove('active')
    setTimeout(() => modal.remove(), 350)
  }

  document.getElementById('vote-modal-close').addEventListener('click', closeModal)
  document.getElementById('vote-modal-cancel').addEventListener('click', closeModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal() })

  document.getElementById('vote-modal-confirm').addEventListener('click', () => {
    const storedCounts = getStoredVoteCounts()
    const currentCount = storedCounts[contestant.name] !== undefined
      ? storedCounts[contestant.name]
      : contestant.votes
    storedCounts[contestant.name] = currentCount + 1
    saveStoredVoteCounts(storedCounts)

    const message = 'ADAMAWA LENS BATTLE 2026 — VOTE\n\n'
      + 'Contestant No. ' + contestant.number + '\n'
      + 'Name: ' + contestant.name + '\n'
      + 'LGA: ' + contestant.lga + '\n\n'
      + 'I have made a payment of \u20a6100 to:\n'
      + 'Bank: Sterling Bank\n'
      + 'Account No: 0093415813\n'
      + 'Account Name: Adamawa Lens Battle\n\n'
      + 'Please find my proof of payment attached.\n'
      + 'I vote for ' + contestant.name + ' to win the Adamawa Lens Battle 2026!'

    const whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message)
    window.open(whatsappUrl, '_blank')
    closeModal()
    showToast('WhatsApp opened! Attach your payment proof to confirm your vote.', 'success')
  })
}

export async function voteForContestant(contestant, allContestants) {
  showVoteConfirmModal(contestant)
  return { success: false, message: '' }
}

