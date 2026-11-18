import { apiClient, unwrap } from './httpClient'
import type { StoredAuth } from '../context/AuthContext'

export interface LoginPayload {
  userName: string
  password: string
  rememberMe: boolean
}

export interface RegisterPayload {
  userName: string
  email: string
  password: string
  confirmPassword: string
}

export const authApi = {
  login: (payload: LoginPayload) =>
    unwrap<StoredAuth>(apiClient.post('/Account/Login', payload)),
  register: (payload: RegisterPayload) =>
    unwrap<StoredAuth>(apiClient.post('/Account/Register', payload)),
  logout: () => unwrap<string>(apiClient.post('/Account/Logout')),
}
