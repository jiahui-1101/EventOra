<template>
  <main class="create-shell">
    <section class="create-header">
      <router-link to="/organiser/dashboard">← Back to Dashboard</router-link>
      <h1>Create New Event</h1>
      <p>Fill in the details — faculty admin will review before publishing.</p>
    </section>
  </main>
</template>

<script setup>
</script>

<style scoped>
.create-shell { padding: 28px; background: var(--surface-soft); min-height: 100vh; }
.create-header { margin-bottom: 24px; }
.create-header a { display: inline-flex; margin-bottom: 14px; color: var(--muted); text-decoration: none; font-size: 0.86rem; }
.create-header h1 { margin: 0 0 6px; font-size: 1.6rem; }
.create-header p { margin: 0; color: var(--muted); font-size: 0.9rem; }
.stepper { display: grid; grid-template-columns: repeat(4, 1fr); align-items: start; margin: 28px 0 34px; position: relative; }
.stepper::before { content: ""; position: absolute; top: 13px; left: 8%; right: 8%; height: 1px; background: var(--border); }
.step-item { position: relative; display: grid; justify-items: center; gap: 8px; color: var(--muted); font-size: 0.76rem; z-index: 1; }
.step-number { width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; background: #e5e7eb; color: var(--muted); font-weight: 700; }
.step-item.done .step-number { background: var(--success); color: #fff; }
.step-item.active { color: var(--primary); font-weight: 700; }
.step-item.active .step-number { background: var(--primary); color: #fff; }
.create-card { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow); padding: 24px; }
.create-card h2 { margin: 0 0 22px; font-size: 1rem; }
.form-label { display: grid; gap: 8px; margin-bottom: 18px; color: var(--muted); font-size: 0.76rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.form-label input,
.form-label select,
.form-label textarea { width: 100%; min-height: 42px; border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0 12px; background: #fff; color: var(--text); font-size: 0.9rem; text-transform: none; letter-spacing: 0; font-weight: 500; }
.form-label textarea { min-height: 100px; padding: 12px; resize: vertical; }
.upload-box { display: grid; place-items: center; min-height: 96px; border: 1.5px dashed var(--border); border-radius: var(--radius-sm); background: #fff; color: var(--muted); text-align: center; font-size: 0.82rem; }
.upload-box strong { color: var(--primary); }
.create-actions { display: flex; justify-content: space-between; gap: 12px; margin-top: 20px; }
.ticket-option { padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.ticket-option strong { display: block; margin-bottom: 4px; color: var(--text); }
.ticket-option p { margin: 0; color: var(--muted); font-size: 0.84rem; }
.review-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
.review-panel { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow); padding: 24px; }
.review-banner { min-height: 180px; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--primary), var(--primary-dark)); color: #fff; display: flex; align-items: end; padding: 20px; margin-bottom: 18px; }
.review-banner h3 { color: #fff; margin: 8px 0 4px; }
.review-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.review-item { padding: 12px; border-radius: var(--radius-sm); background: var(--surface-soft); }
.review-item span { display: block; color: var(--muted); font-size: 0.74rem; font-weight: 700; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
.review-item strong { display: block; color: var(--text); font-size: 0.9rem; }
.approval-note { padding: 14px; border: 1px solid #bfdbfe; border-radius: var(--radius-sm); background: #eff6ff; color: #1d4ed8; font-size: 0.86rem; margin-bottom: 16px; }
@media (max-width: 760px) {
  .create-shell { padding: 18px; }
  .stepper { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .stepper::before { display: none; }
  .review-layout { grid-template-columns: 1fr; }
}
</style>