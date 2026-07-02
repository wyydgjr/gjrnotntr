/**
 * 仪表盘相关 API
 */
import request from './request'

/** 获取统计数据 */
export function getStats() {
  return request.get('/dashboard/stats')
}

/** 获取最近活动 */
export function getActivities() {
  return request.get('/dashboard/activities')
}

/** 获取营收数据 */
export function getRevenue() {
  return request.get('/dashboard/revenue')
}
