/**
 * 通用 CRUD 资源 API 工厂
 */
import request from './request'

export function createResourceApi(resource) {
  return {
    /** 分页列表 */
    list(params) {
      return request.get(`/${resource}`, { params })
    },
    /** 获取单条 */
    get(id) {
      return request.get(`/${resource}/${id}`)
    },
    /** 新增 */
    create(data) {
      return request.post(`/${resource}`, data)
    },
    /** 更新 */
    update(id, data) {
      return request.put(`/${resource}/${id}`, data)
    },
    /** 删除 */
    remove(id) {
      return request.delete(`/${resource}/${id}`)
    },
  }
}
