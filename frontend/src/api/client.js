// src/api/client.js
import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api', // after this need to put real de
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventora_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default apiClient