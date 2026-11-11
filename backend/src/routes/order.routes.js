const express = require('express');
const {
  create, myOrders, allOrders, detail, cancel, payOrder, confirmOrder, updateStatus,
  archive, unarchive, expireCheck, updateRemark,
} = require('../controllers/order.controller');
const { authRequired, adminRequired } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// 所有订单接口均需登录
router.post('/', authRequired, asyncHandler(create));                    // 创建订单（可带备注）
router.get('/mine', authRequired, asyncHandler(myOrders));               // 我的订单
// 管理员：手动触发待支付超时检查（定时任务的手动版，便于答辩演示）
// 注意必须放在 /:id 系列路由之前，避免 expire-check 被当成订单ID
router.post('/expire-check', authRequired, adminRequired, asyncHandler(expireCheck));
router.post('/:id/cancel', authRequired, asyncHandler(cancel));          // 取消订单（待支付）
router.post('/:id/remark', authRequired, asyncHandler(updateRemark));    // 保存订单备注（本人或管理员）
router.post('/:id/pay', authRequired, asyncHandler(payOrder));           // 支付订单（本人，待支付→已支付）
router.post('/:id/confirm', authRequired, asyncHandler(confirmOrder));   // 确认收货（本人，已发货→已完成）
router.get('/:id', authRequired, asyncHandler(detail));                  // 订单详情（本人或管理员）

// 管理员接口
router.get('/', authRequired, adminRequired, asyncHandler(allOrders));   // 全部订单（默认仅未归档，archived=1 查已归档）
router.post('/:id/status', authRequired, adminRequired, asyncHandler(updateStatus)); // 更新订单状态
router.post('/:id/archive', authRequired, adminRequired, asyncHandler(archive));       // 归档订单（软删除，仅已完成/已取消）
router.post('/:id/unarchive', authRequired, adminRequired, asyncHandler(unarchive));   // 取消归档（恢复展示）

module.exports = router;
