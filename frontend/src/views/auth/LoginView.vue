<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1>Welcome back</h1>
      <p class="auth-subtitle">Login to manage your events and tickets</p>

      <form class="auth-form">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@utm.my"
          required
        />

        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          required
        />

        <button type="submit" class="button button-primary auth-submit">
          Login
        </button>
      </form>

      <p class="auth-switch">
        Don't have an account?
        <router-link to="/register">Create one</router-link>
      </p>
    </div>
  </div>
</template>