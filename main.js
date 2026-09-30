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
  const container = document.getElementById('featured-grid')
  if (!container) return
  if (!contestants || contestants.length === 0) {
    container.innerHTML = '<div class="empty-state">No contestants available.</div>'
    return
  }

  const top3 = contestants.slice(0, 3)
  const [first, second, third] = top3

  const podiumCard = (c, rank) => {
    if (!c) return ''
    const statusWords = ['LEADING', 'FOLLOWING', 'CLOSE BEHIND']
    const labels = ['CURRENTLY LEADING', '2ND PLACE', '3RD PLACE']
    const rankClasses = ['podium-first', 'podium-second', 'podium-third']
    return `
      <div class="podium-card ${rankClasses[rank - 1]}" style="animation-delay:${rank * 0.15}s">
        <div class="podium-status-badge podium-status-${rank}">${statusWords[rank - 1]}</div>
        <div class="podium-photo-wrap">
          <img src="${c.photo}" alt="${c.name}" class="podium-photo" loading="lazy" />
          <div class="podium-rank-badge">${rank}</div>
        </div>
        <div class="podium-info">
          <div class="podium-label">${labels[rank - 1]}</div>
          <div class="podium-name">${c.name}</div>
          <div class="podium-lga">${c.lga || ''} LGA</div>
          <div class="podium-votes">${c.votes.toLocaleString()} <span>votes</span></div>
        </div>
        <div class="podium-base podium-base-${rank}"></div>
      </div>
    `
  }

  container.innerHTML = `
    <div class="podium-stage">
      ${podiumCard(second, 2)}
      ${podiumCard(first, 1)}
      ${podiumCard(third, 3)}
    </div>
  `
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
