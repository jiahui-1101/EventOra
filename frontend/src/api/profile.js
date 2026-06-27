// src/api/profile.js
import apiClient from './client'

export function getMeApi() {
  return apiClient.get('/me')
}

export function updateMeApi(payload) {
  return apiClient.put('/me', payload)
}