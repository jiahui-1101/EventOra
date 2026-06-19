<template>
  <main class="detail-shell">
    <router-link class="back-link" to="/organiser/dashboard">← Back to Dashboard</router-link>

    <section class="detail-header">
    </section>

    <section class="detail-layout">
    </section>
  </main>
</template>

<script setup>
</script>

<style scoped>
.detail-shell { padding: 28px; background: var(--surface-soft); min-height: 100vh; }
.back-link { display: inline-flex; margin-bottom: 14px; color: var(--muted); text-decoration: none; font-size: 0.86rem; }
.detail-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; margin-bottom: 22px; }
.detail-header h1 { margin: 0 0 6px; font-size: 1.6rem; }
.detail-header p { margin: 0; color: var(--muted); font-size: 0.9rem; }
.detail-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
.detail-card,
.side-card { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow); padding: 24px; }
.poster-preview { min-height: 220px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; display: flex; align-items: end; padding: 22px; margin-bottom: 18px; }
.poster-preview h2 { color: #fff; margin: 10px 0 6px; }
.poster-preview p { margin: 0; color: rgba(255, 255, 255, 0.82); }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.info-item { padding: 12px; border-radius: var(--radius-sm); background: var(--surface-soft); }
.info-item span { display: block; color: var(--muted); font-size: 0.74rem; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
.info-item strong { display: block; color: var(--text); font-size: 0.9rem; }
.section-title { margin: 24px 0 10px; font-size: 1rem; }
.approval-note { padding: 14px; border-radius: var(--radius-sm); font-size: 0.86rem; margin-bottom: 14px; }
.approval-draft { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
.approval-pending { background: var(--warning-soft); border: 1px solid #fde68a; color: #92400e; }
.approval-published { background: var(--success-soft); border: 1px solid #bbf7d0; color: #065f46; }
.approval-rejected,
.approval-cancelled { background: var(--danger-soft); border: 1px solid #fecaca; color: #991b1b; }
.action-list { display: grid; gap: 10px; }
.full-width { width: 100%; justify-content: center; }
@media (max-width: 900px) {
  .detail-layout { grid-template-columns: 1fr; }
  .detail-header { display: block; }
}
</style>