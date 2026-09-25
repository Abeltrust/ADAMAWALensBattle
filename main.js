import {
  setupNavbar,
  loadContestants,
  getMergedContestants,
  getMaxVotes,
  renderStats,
  voteForContestant,
  showToast,
  getLocalVotes,
} from './app.js'

let allContestants = []
let votedContestants = new Set()

function renderFeatured(contestants) {
  const grid = document.getElementById('featured-grid')
  if (!grid) return
  if (!contestants || contestants.length === 0) {
    grid.innerHTML = '<div class="empty-state">No contestants available.</div>'
    return
  }

  // Show only the top 3 contestants on the homepage
  const featured = contestants.slice(0, 3)
  const maxVotes = getMaxVotes(contestants)

  grid.innerHTML = featured
    .map((c, index) => {
      return `
      <div class="contestant-card" data-name="${c.name}" style="animation-delay: ${index * 0.08}s">
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

  if (window.lucide) window.lucide.createIcons()

  grid.querySelectorAll('.contestant-card').forEach((card) => {
    card.addEventListener('click', () => handleVote(card.dataset.name))
  })

  grid.querySelectorAll('.contestant-vote-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      handleVote(btn.dataset.name)
    })
  })
}

function renderHomeLeaderboard(contestants) {
  const leaderboard = document.getElementById('home-leaderboard')
  if (!leaderboard) return
  if (!contestants || contestants.length === 0) {
    leaderboard.innerHTML = '<div class="empty-state">No results yet.</div>'
    return
  }

  const maxVotes = getMaxVotes(contestants)
  const top5 = contestants.slice(0, 5)

  leaderboard.innerHTML = top5
    .map((c, index) => {
      const barWidth = (c.votes / maxVotes) * 100
      const rankClass = index === 0 ? 'top-1' : index < 3 ? 'top-3' : ''
      return `
      <div class="leaderboard-item ${rankClass}" style="animation-delay: ${index * 0.08}s">
        <span class="leaderboard-rank">${index + 1}</span>
        <img class="leaderboard-photo" src="${c.photo}" alt="${c.name}" loading="lazy" />
        <div class="leaderboard-info">
          <div class="leaderboard-name">${c.name}</div>
          <div class="leaderboard-category">${c.lga || ''} LGA</div>
        </div>
        <div class="leaderboard-bar">
          <div class="leaderboard-bar-fill" style="width: ${barWidth}%"></div>
        </div>
        <span class="leaderboard-votes">${c.votes.toLocaleString()}</span>
      </div>
    `
    })
    .join('')
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

  renderFeatured(allContestants)
  renderHomeLeaderboard(allContestants)
  renderStats(allContestants)
}

init()
