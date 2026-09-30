import {
  setupNavbar,
  loadContestants,
  getMergedContestants,
  getMaxVotes,
} from './app.js'
import Chart from 'chart.js/auto'

let chartInstance = null

function renderTop5(contestants) {
  const container = document.getElementById('top5-pictures')
  if (!container) return
  if (!contestants || contestants.length === 0) {
    container.innerHTML = '<div class="empty-state">No results yet.</div>'
    return
  }

  const top3 = contestants.slice(0, 3)
  const [first, second, third] = top3

  // Podium layout: 2nd | 1st (big) | 3rd
  // We render in DOM order: second, first, third
  // CSS uses order property to position them visually

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


function renderLeaderboard(contestants) {
  const leaderboard = document.getElementById('leaderboard')
  if (!leaderboard) return
  if (!contestants || contestants.length === 0) {
    leaderboard.innerHTML = '<div class="empty-state">No results yet.</div>'
    return
  }

  const maxVotes = getMaxVotes(contestants)

  leaderboard.innerHTML = contestants
    .map((c, index) => {
      const barWidth = (c.votes / maxVotes) * 100
      const rankClass = index === 0 ? 'top-1' : index < 3 ? 'top-3' : ''
      return `
      <div class="leaderboard-item ${rankClass}" style="animation-delay: ${index * 0.06}s">
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

function renderChart(contestants) {
  const canvas = document.getElementById('results-chart')
  if (!canvas) return

  const top8 = contestants.slice(0, 8)
  const labels = top8.map((c) => c.name)
  const data = top8.map((c) => c.votes)

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Votes',
        data,
        backgroundColor: [
          '#d4a72c',
          '#d4a72c',
          '#d4a72c',
          '#8b6f3f',
          '#8b6f3f',
          '#8b6f3f',
          '#3a3a44',
          '#3a3a44',
        ],
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#16161b',
          borderColor: 'rgba(212, 167, 44, 0.35)',
          borderWidth: 1,
          padding: 12,
          titleColor: '#f8f8f5',
          bodyColor: '#b0b0b5',
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'Inter' },
          callbacks: {
            label: (ctx) => `${ctx.parsed.y.toLocaleString()} votes`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#b0b0b5',
            font: { size: 11, family: 'Inter' },
            maxRotation: 45,
            minRotation: 30,
          },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#6a6a72',
            font: { size: 11, family: 'Inter' },
          },
        },
      },
      animation: {
        duration: 1200,
        easing: 'easeOutQuart',
      },
    },
  })
}

async function init() {
  setupNavbar()

  const baseContestants = await loadContestants()
  const contestants = getMergedContestants(baseContestants)

  renderTop5(contestants)
  renderChart(contestants)
  renderLeaderboard(contestants)

  // --- Leaderboard search ---
  const searchInput = document.getElementById('leaderboard-search')
  const clearBtn    = document.getElementById('leaderboard-search-clear')
  const countEl     = document.getElementById('leaderboard-search-count')

  function updateCount(filtered, total) {
    if (!countEl) return
    countEl.textContent = searchInput && searchInput.value.trim()
      ? `${filtered} of ${total} contestants`
      : `${total} contestants`
  }

  updateCount(contestants.length, contestants.length)

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase()
      clearBtn && (clearBtn.style.display = q ? 'flex' : 'none')
      const filtered = q
        ? contestants.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.lga  || '').toLowerCase().includes(q)
          )
        : contestants
      renderLeaderboard(filtered)
      updateCount(filtered.length, contestants.length)
    })
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = ''
      clearBtn.style.display = 'none'
      renderLeaderboard(contestants)
      updateCount(contestants.length, contestants.length)
      searchInput && searchInput.focus()
    })
  }
}

init()
