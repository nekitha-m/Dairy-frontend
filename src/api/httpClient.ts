import axios from 'axios'
import { AUTH_STORAGE_KEY } from '../context/AuthContext'

// Master, Transaction and Report modules are all served by one API.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://192.168.0.17:8060/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const transactionApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

export const reportApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})


for (const client of [apiClient, transactionApiClient, reportApiClient]) {
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const isLoginRequest = error.config?.url?.includes('/Account/Login')
      if (error.response?.status === 401 && !isLoginRequest) {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )
}

interface ApiEnvelope<T> {
  statusCode: number
  message: string | null
  result: T
  success: boolean
}

export async function unwrap<T>(request: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const { data } = await request
  if (!data.success) {
    throw new Error(data.message || 'Request failed')
  }
  return data.result
}
