<template>
  <main class="create-shell">
    <section class="create-header">
      <router-link to="/organiser/dashboard">← Back to Dashboard</router-link>
      <h1>Create New Event</h1>
      <p>Fill in the details — faculty admin will review before publishing.</p>
    </section>

    <section class="stepper">
      <div
        v-for="(s, idx) in steps"
        :key="s.key"
        :class="['step-item', { active: currentStep === idx, done: currentStep > idx }]"
      >
        <span class="step-number">{{ idx + 1 }}</span>
        <span>{{ s.label }}</span>
      </div>
    </section>

        <section v-if="currentStep === 0" class="create-card">
      <h2>Step 1 — Basic Information</h2>

      <label class="form-label">
        Event title *
        <input type="text" v-model="form.title" placeholder="e.g. Annual Tech Symposium 2026" />
      </label>

      <div class="input-row-2">
        <label class="form-label">
          Category *
          <select v-model="form.category">
            <option value="">Select category...</option>
            <option>Academic</option>
            <option>Sports</option>
            <option>Cultural</option>
            <option>Religious</option>
            <option>Workshop</option>
          </select>
        </label>
        <label class="form-label">
          Society *
          <select v-model="form.society">
            <option>Computer Society UTM</option>
            <option>IEEE UTM</option>
            <option>Sports Club UTM</option>
            <option>Cultural Club</option>
          </select>
        </label>
      </div>

      <div class="input-row-2">
        <label class="form-label">
          Start date &amp; time *
          <input type="datetime-local" v-model="form.startDateTime" />
        </label>
        <label class="form-label">
          End date &amp; time *
          <input type="datetime-local" v-model="form.endDateTime" />
        </label>
      </div>

      <label class="form-label">
        Venue *
        <input type="text" v-model="form.location" placeholder="e.g. Dewan Sultan Iskandar, UTM JB" />
      </label>

      <label class="form-label">
        Event description *
        <textarea v-model="form.description" placeholder="Describe your event — agenda, speakers, requirements..."></textarea>
      </label>

      <label class="form-label">
        Banner image
        <div class="upload-box">
          <div>Drag &amp; drop image here or <strong>browse</strong><br /><span>PNG, JPG up to 5MB · Recommended 1200x400px</span></div>
        </div>
      </label>

      <div class="create-actions">
        <router-link class="button button-ghost" to="/organiser/dashboard">Cancel</router-link>
        <button class="button button-primary" @click="nextStep">Next: Ticketing →</button>
      </div>
    </section>

  </main>
</template>

<script setup>
import { ref, reactive } from 'vue'

const steps = [
  { key: 'basic', label: 'Basic Info' },
  { key: 'ticketing', label: 'Ticketing' },
  { key: 'details', label: 'Details' },
  { key: 'review', label: 'Review' },
]

const currentStep = ref(0)

const form = reactive({
  title: '',
  category: '',
  society: 'Computer Society UTM',
  startDateTime: '',
  endDateTime: '',
  location: '',
  description: '',
  capacity: null,
  deadline: '',
  feeType: 'Free',
  feeAmount: 0,
  waitlist: 'enabled',
  contactName: '',
  contactEmail: '',
  instructions: '',
})

function nextStep() {
  currentStep.value++
}

function prevStep() {
  currentStep.value--
}
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