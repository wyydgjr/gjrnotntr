const express = require('express');
const {
  overview, categoryRatio, salesTrend, ordersTrend, lowStockList,
  statusDistribution, topProducts,
} = require('../controllers/stats.controller');
const { authRequired, adminRequired } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// 统计看板接口（仅管理员）
router.get('/overview', authRequired, adminRequired, asyncHandler(overview));          // 核心指标
router.get('/category', authRequired, adminRequired, asyncHandler(categoryRatio));     // 分类占比
router.get('/trend', authRequired, adminRequired, asyncHandler(salesTrend));           // 销售趋势
router.get('/orders-trend', authRequired, adminRequired, asyncHandler(ordersTrend));   // 订单量趋势
router.get('/low-stock', authRequired, adminRequired, asyncHandler(lowStockList));     // 低库存商品明细
router.get('/status-distribution', authRequired, adminRequired, asyncHandler(statusDistribution)); // 订单状态分布
router.get('/top-products', authRequired, adminRequired, asyncHandler(topProducts));   // 畅销商品 Top5

module.exports = router;
