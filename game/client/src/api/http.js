import axios from 'axios'
import { useAuthStore } from '../store/auth'

const http = axios.create({ baseURL: 'http://localhost:3000' })

http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

export default http
