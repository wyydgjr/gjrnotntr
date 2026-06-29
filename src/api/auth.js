import request from './request'

export function login(data) {
  return request.post('/auth/login', data)
}

export function getUserInfo() {
  return request.get('/auth/userinfo')
}

export function updateProfile(data) {
  return request.put('/auth/profile', data)
}

export function getDashboardStats() {
  return request.get('/dashboard/stats')
}

export function getDashboardActivities() {
  return request.get('/dashboard/activities')
}

export function getDashboardRevenue() {
  return request.get('/dashboard/revenue')
}
