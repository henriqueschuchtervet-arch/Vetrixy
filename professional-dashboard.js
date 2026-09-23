(() => {
  'use strict';

  const monthsPt = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];

  window.renderDashboardAnalytics = function renderDashboardAnalytics() {
    renderActivity();
    renderSpecies();
    decorateStats();
  };

  function decorateStats() {
    const details = ['base ativa','registros clínicos','documentos emitidos','pedidos de exames'];
    document.querySelectorAll('#stats-grid .stat').forEach((card, index) => {
      let detail = card.querySelector('.stat-detail');
      if (!detail) {
        detail = document.createElement('span');
        detail.className = 'stat-detail';
        card.appendChild(detail);
      }
      detail.textContent = details[index] || '';
    });
  }

  function renderActivity() {
    const target = document.getElementById('activity-chart');
    if (!target) return;
    const prontuarios = typeof allProntuarios !== 'undefined' ? allProntuarios : [];
    const receitas = typeof allReceitas !== 'undefined' ? allReceitas : [];
    const requisicoes = typeof allRequisicoes !== 'undefined' ? allRequisicoes : [];
    const records = [...prontuarios, ...receitas, ...requisicoes];
    const now = new Date();
    const buckets = Array.from({ length: 6 }, (_, offset) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - offset), 1);
      return { key: `${date.getFullYear()}-${date.getMonth()}`, label: monthsPt[date.getMonth()], value: 0 };
    });
    records.forEach(record => {
      const parsed = new Date(record.created_at || record.data || '');
      if (Number.isNaN(parsed.getTime())) return;
      const bucket = buckets.find(item => item.key === `${parsed.getFullYear()}-${parsed.getMonth()}`);
      if (bucket) bucket.value += 1;
    });
    const max = Math.max(1, ...buckets.map(item => item.value));
    target.innerHTML = buckets.map(item => {
      const height = Math.max(4, Math.round((item.value / max) * 118));
      return `<div class="activity-col"><span class="activity-value" style="--bar-height:${height}px">${item.value}</span><div class="activity-bar" style="height:${height}px"></div><span class="activity-label">${item.label}</span></div>`;
    }).join('');
  }

  function renderSpecies() {
    const donut = document.getElementById('species-donut');
    const legend = document.getElementById('species-legend');
    if (!donut || !legend) return;
    const patients = typeof allPacientes !== 'undefined' ? allPacientes : [];
    if (!patients.length) {
      donut.style.background = 'rgba(255,255,255,.05)';
      donut.querySelector('strong').textContent = '0';
      legend.innerHTML = '<div class="insight-empty" style="height:105px">Cadastre pacientes para visualizar o perfil da base.</div>';
      return;
    }
    const counts = new Map();
    patients.forEach(patient => {
      const label = String(patient.especie || 'Não informado').trim();
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    const colors = ['#00cfff','#9b4dff','#d44dff','#36d399','#ffb547'];
    const entries = [...counts.entries()].sort((a,b) => b[1] - a[1]).slice(0,5);
    const total = patients.length;
    let cursor = 0;
    const stops = entries.map(([label, value], index) => {
      const start = cursor;
      cursor += value / total * 100;
      return `${colors[index]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    });
    if (cursor < 100) stops.push(`rgba(255,255,255,.08) ${cursor.toFixed(2)}% 100%`);
    donut.style.background = `conic-gradient(${stops.join(',')})`;
    donut.querySelector('strong').textContent = total;
    legend.innerHTML = entries.map(([label, value], index) => `<div class="legend-item"><span class="legend-dot" style="background:${colors[index]}"></span><span>${escapeHtml(label)}</span><strong>${Math.round(value / total * 100)}%</strong></div>`).join('');
  }
})();
