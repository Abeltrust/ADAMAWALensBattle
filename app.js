import './style.css'

const WHATSAPP_NUMBER = '2348141003660'
const CSV_PATH = '/contestants.csv'

// Automatically purge any old client-side vote caches so only official votes show
try {
  localStorage.removeItem('adamaway_vote_counts')
  localStorage.removeItem('adamaway_votes')
} catch (e) {}

export async function loadContestants() {
  try {
    const res = await fetch(`${CSV_PATH}?_t=${Date.now()}`)
    if (!res.ok) throw new Error(`Failed to load ${CSV_PATH}`)
    const text = await res.text()
    const parsed = parseCSV(text)
    console.log(`✓ Loaded ${parsed.length} contestants from local CSV`)
    return parsed
  } catch (e) {
    console.error('Failed to load contestants:', e)
    return []
  }
}

function parseCSV(text) {
  const lines = text.trim().split('\n')

  // Column name mapping: handles both Google Sheet headers and local CSV headers
  const COL_MAP = {
    'contestant name': 'name',
    'name': 'name',
    'contestant #': 'number',
    'contestant#': 'number',
    'number': 'number',
    'lga': 'lga',
    'votes': 'votes',
    'bio': 'bio',
    'photo reference': 'photo',
    'photo': 'photo',
  }

  // Auto-detect the real header row by scanning the first 10 rows.
  // We look for a row that contains recognisable column keywords.
  let headerIdx = 0
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase()
    if (
      (lower.includes('contestant name') || lower.includes('name')) &&
      (lower.includes('lga') || lower.includes('votes'))
    ) {
      headerIdx = i
      break
    }
  }

  const rawHeaders = parseCSVLine(lines[headerIdx])
  // Map raw headers to internal field names
  const headers = rawHeaders.map(h => COL_MAP[h.trim().toLowerCase()] || h.trim())

  const rows = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCSVLine(lines[i])
    const row = {}
    headers.forEach((key, idx) => {
      if (key) row[key] = (values[idx] || '').trim()
    })
    // Skip summary/empty rows that have no contestant name
    if (!row.name) continue
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
  return new Set()
}

export function saveLocalVote(name) {
  // No client-side vote mutations
}

export function getStoredVoteCounts() {
  return {}
}

export function saveStoredVoteCounts(counts) {
  // No client-side vote mutations
}

export function getMergedContestants(baseContestants) {
  // Purely use the official vote numbers from the source (Google Sheet)
  return [...baseContestants].sort((a, b) => (b.votes || 0) - (a.votes || 0))
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
        <div class="vote-qty-section">
          <div class="vote-qty-header">
            <span class="vote-qty-label">How Many Votes?</span>
            <span class="vote-qty-total" id="vote-total-display">&#x20A6;100 (1 Vote)</span>
          </div>
          <div class="vote-qty-controls">
            <button class="vote-qty-btn" id="vote-qty-minus" type="button" aria-label="Decrease votes">-</button>
            <input type="number" class="vote-qty-input" id="vote-qty-input" value="1" min="1" max="1000" />
            <button class="vote-qty-btn" id="vote-qty-plus" type="button" aria-label="Increase votes">+</button>
          </div>
          <div class="vote-presets">
            <button class="vote-preset-chip active" type="button" data-count="1">1 Vote</button>
            <button class="vote-preset-chip" type="button" data-count="5">5 Votes</button>
            <button class="vote-preset-chip" type="button" data-count="10">10 Votes</button>
            <button class="vote-preset-chip" type="button" data-count="20">20 Votes</button>
            <button class="vote-preset-chip" type="button" data-count="50">50 Votes</button>
          </div>
        </div>

        <div class="vote-payment-box">
          <div class="vote-payment-row">
            <span class="vote-payment-label">Bank</span>
            <span class="vote-payment-value">Sterling Bank</span>
          </div>
          <div class="vote-payment-row">
            <span class="vote-payment-label">Account No.</span>
            <span class="vote-payment-value acct-num" style="display:flex;align-items:center;gap:8px;">
              <span id="acct-number-text">xxxxxxxxx</span>
              <button id="copy-acct-btn" title="Copy account number" onclick="(function(){
                navigator.clipboard.writeText('xxxxxxxxx').then(function(){
                  var btn=document.getElementById('copy-acct-btn');
                  btn.textContent='✓ Copied!';
                  setTimeout(function(){btn.textContent='Copy';},2000);
                });
              })()" style="background:rgba(255,215,0,0.15);border:1px solid rgba(255,215,0,0.4);color:#ffd700;border-radius:4px;padding:2px 8px;font-size:0.75rem;cursor:pointer;white-space:nowrap;">Copy</button>
            </span>
          </div>
          <div class="vote-payment-row">
            <span class="vote-payment-label">Account Name</span>
            <span class="vote-payment-value">Adamawa Lens Battle</span>
          </div>
        </div>
        <p class="vote-modal-note">
          <i data-lucide="info"></i>
          Transfer exact amount above, then tap below to send your receipt on WhatsApp.
        </p>
      </div>

      <div class="vote-modal-actions">
        <button class="vote-modal-cancel" id="vote-modal-cancel">Cancel</button>
        <button class="vote-modal-confirm" id="vote-modal-confirm">
          <i data-lucide="message-circle"></i>
          <span id="vote-btn-text">Send Proof on WhatsApp</span>
        </button>
      </div>
    </div>
  `
  document.body.appendChild(modal)
  if (window.lucide) window.lucide.createIcons()
  requestAnimationFrame(() => modal.classList.add('active'))

  const qtyInput = document.getElementById('vote-qty-input')
  const totalDisplay = document.getElementById('vote-total-display')
  const btnText = document.getElementById('vote-btn-text')
  const minusBtn = document.getElementById('vote-qty-minus')
  const plusBtn = document.getElementById('vote-qty-plus')
  const presetChips = modal.querySelectorAll('.vote-preset-chip')

  const updateTotal = () => {
    let val = parseInt(qtyInput.value, 10)
    if (isNaN(val) || val < 1) val = 1
    qtyInput.value = val
    const cost = val * 100
    const label = val === 1 ? '1 Vote' : `${val} Votes`
    totalDisplay.innerHTML = `&#x20A6;${cost.toLocaleString()} (${label})`
    btnText.textContent = `Send Proof on WhatsApp (₦${cost.toLocaleString()})`

    presetChips.forEach(chip => {
      if (parseInt(chip.dataset.count, 10) === val) {
        chip.classList.add('active')
      } else {
        chip.classList.remove('active')
      }
    })
  }

  minusBtn.addEventListener('click', () => {
    let val = parseInt(qtyInput.value, 10) || 1
    if (val > 1) {
      qtyInput.value = val - 1
      updateTotal()
    }
  })

  plusBtn.addEventListener('click', () => {
    let val = parseInt(qtyInput.value, 10) || 1
    qtyInput.value = val + 1
    updateTotal()
  })

  qtyInput.addEventListener('input', updateTotal)

  presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      qtyInput.value = chip.dataset.count
      updateTotal()
    })
  })

  updateTotal()

  const closeModal = () => {
    modal.classList.remove('active')
    setTimeout(() => modal.remove(), 350)
  }

  document.getElementById('vote-modal-close').addEventListener('click', closeModal)
  document.getElementById('vote-modal-cancel').addEventListener('click', closeModal)
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal() })

  document.getElementById('vote-modal-confirm').addEventListener('click', () => {
    let voteCount = parseInt(qtyInput.value, 10) || 1
    if (voteCount < 1) voteCount = 1
    const totalAmount = voteCount * 100
    const voteWord = voteCount === 1 ? '1 vote' : `${voteCount} votes`

    const message = `ADAMAWA LENS BATTLE 2026 — VOTE PROOF\n\n`
      + `• Contestant: #${contestant.number || ''} ${contestant.name} (${contestant.lga || ''} LGA)\n`
      + `• Votes: ${voteWord} (₦${totalAmount.toLocaleString()})\n\n`
      + `I have made payment to Sterling Bank (Adamawa Lens Battle).\n`
      + `Payment proof attached — kindly verify and credit my vote(s)!`

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

