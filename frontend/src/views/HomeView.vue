<template>
  <main class="app-shell">
    <section class="hero-section">
      <div>
        <p class="eyebrow">Discover events</p>
        <h1>What's happening at UTM?</h1>

        <p class="hero-copy">
          Browse society workshops, cultural nights, tournaments, and talks.
        </p>

        <div class="search-panel">
          <input
            type="text"
            placeholder="Search by title or society..."
          />
        </div>
      </div>

      <aside class="hero-card">
        <span>This month</span>
        <strong>0 events live</strong>
      </aside>
    </section>

    <section class="stats-grid">
      <article class="stat-card">
        <span>Upcoming Events</span>
        <strong>0</strong>
      </article>

      <article class="stat-card">
        <span>Active Societies</span>
        <strong>12</strong>
      </article>

      <article class="stat-card">
        <span>This Week</span>
        <strong>0</strong>
      </article>

      <article class="stat-card">
        <span>Free Events</span>
        <strong>0</strong>
      </article>
    </section>

    <section class="toolbar">
      <div>
        <p class="eyebrow">Featured calendar</p>
        <h2>Upcoming society activities</h2>
      </div>

      <div class="filter-bar">
        <select>
          <option value="all">All</option>
          <option value="academic">Academic</option>
          <option value="sports">Sports</option>
          <option value="cultural">Cultural</option>
          <option value="religious">Religious</option>
        </select>

        <select>
          <option value="all">All</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>

        <select>
          <option value="all">Any time</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
        </select>

        <button
          class="button button-secondary"
        >
          Clear filters
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
</script>