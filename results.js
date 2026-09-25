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

  const top5 = contestants.slice(0, 5)
  const maxVotes = getMaxVotes(contestants)

  container.innerHTML = top5
    .map((c, index) => {
      const barWidth = (c.votes / maxVotes) * 100
      const rankClass = index === 0 ? 'top-1' : index < 3 ? 'top-3' : ''
      const medal = index === 0 ? 'Champion' : index === 1 ? '2nd Place' : index === 2 ? '3rd Place' : `${index + 1}th`
      return `
      <div class="top5-card ${rankClass}" style="animation-delay: ${index * 0.12}s">
        <div class="top5-photo">
          <img src="${c.photo}" alt="${c.name}" loading="lazy" />
          <span class="top5-rank">${index + 1}</span>
        </div>
        <div class="top5-info">
          <div class="top5-name">${c.name}</div>
          <div class="top5-category">${c.lga || ''} LGA · ${medal}</div>
          <div class="top5-bar-track">
            <div class="top5-bar-fill" style="width: ${barWidth}%"></div>
          </div>
          <div class="top5-votes">${c.votes.toLocaleString()} votes</div>
        </div>
      </div>
    `
    })
    .join('')
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
}

init()
