import {
  setupNavbar,
  loadContestants,
  getMergedContestants,
  getMaxVotes,
  voteForContestant,
  showToast,
  getLocalVotes,
} from './app.js'

let allContestants = []
let votedContestants = new Set()

function renderContestants(contestants) {
  const grid = document.getElementById('contestants-grid')
  if (!grid) return
  if (!contestants || contestants.length === 0) {
    grid.innerHTML = '<div class="empty-state">No contestants found.</div>'
    return
  }

  grid.innerHTML = contestants
    .map((c, index) => {
      return `
      <div class="contestant-card" data-name="${c.name}" style="animation-delay: ${index * 0.06}s">
        <div class="contestant-photo">
          <img src="${c.photo}" alt="${c.name}" loading="lazy" />
          <div class="contestant-card-overlay">
            <div class="contestant-card-meta">
              <span class="contestant-card-num">No. ${c.number || String(index+1).padStart(2,'0')}</span>
              <span class="contestant-card-lga">${c.lga || ''} LGA</span>
            </div>
            <div class="contestant-card-name">${c.name}</div>
            <button class="contestant-vote-btn" data-name="${c.name}">
              <i data-lucide="vote"></i>
              Vote Now
            </button>
          </div>
        </div>
      </div>
    `
    })
    .join('')

  // Init lucide icons
  if (window.lucide) window.lucide.createIcons()

  // Clicking anywhere on card opens modal
  grid.querySelectorAll('.contestant-card').forEach((card) => {
    card.addEventListener('click', () => {
      handleVote(card.dataset.name)
    })
  })

  // Button also triggers
  grid.querySelectorAll('.contestant-vote-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      handleVote(btn.dataset.name)
    })
  })
}

async function handleVote(name) {
  const contestant = allContestants.find((c) => c.name === name)
  if (!contestant) return
  await voteForContestant(contestant, allContestants)
}

async function init() {
  setupNavbar()

  const baseContestants = await loadContestants()
  allContestants = getMergedContestants(baseContestants)
  votedContestants = getLocalVotes()

  renderContestants(allContestants)
}

init()
