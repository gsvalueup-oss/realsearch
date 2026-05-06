import axios from 'axios'

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  }
  // 서버 사이드
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
})

export default api
