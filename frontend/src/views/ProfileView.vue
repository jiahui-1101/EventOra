<template>
  <main class="app-shell">
    <section class="page-section">

      <div class="section-heading">
        <div>
          <p class="eyebrow">Account settings</p>
          <h2>Edit Profile</h2>
        </div>
        <span class="badge badge-blue">Student</span>
      </div>

      <div class="profile-layout">

        <div class="profile-avatar-card">
          <div class="avatar-circle">ST</div>
          <strong>First Last</strong>
          <span class="badge badge-blue">Student</span>
          <p class="profile-society">EventOra member</p>
          <button class="button button-ghost full-width" style="margin-top:8px;">Change photo</button>
        </div>

        <div class="profile-form-card">
          <h3>Personal Information</h3>

          <div class="input-row-2">
            <div class="input-label">First name <input type="text" /></div>
            <div class="input-label">Last name <input type="text" /></div>
          </div>

          <div class="input-label">Email <input type="email" /></div>
          <div class="input-label">Matric number <input type="text" /></div>

          <div class="profile-divider">Security</div>

          <div class="input-label">Current password <input type="password" /></div>
          <div class="input-row-2">
            <div class="input-label">New password <input type="password" /></div>
            <div class="input-label">Confirm <input type="password" /></div>
          </div>

          <div class="profile-actions">
            <router-link class="button button-ghost" to="/">Cancel</router-link>
            <button class="button button-primary">Save changes</button>
          </div>
        </div>
      </div>

    </section>
  </main>
</template>

<script setup>
</script>