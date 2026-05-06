import axios from 'axios'

const baseURL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : 'http://localhost:8000'

const api = axios.create({
  baseURL,
  timeout: 10000,
})

export default api
