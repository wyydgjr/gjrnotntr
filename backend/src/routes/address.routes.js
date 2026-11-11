/**
 * 收货地址簿路由（全部需要登录，控制器内按 req.user.id 做归属校验）
 */
const express = require('express');
const { list, create, update, remove, setDefault } = require('../controllers/address.controller');
const { authRequired } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(authRequired); // 地址簿属于个人数据，统一要求登录

router.get('/', asyncHandler(list));                       // 我的地址列表
router.post('/', asyncHandler(create));                    // 新增地址
router.put('/:id', asyncHandler(update));                  // 编辑地址
router.delete('/:id', asyncHandler(remove));               // 删除地址
router.post('/:id/default', asyncHandler(setDefault));     // 设为默认地址

module.exports = router;
