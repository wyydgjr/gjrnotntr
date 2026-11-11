const express = require('express');
const {
  list, detail, create, update, remove, toggleStatus, listCategories,
} = require('../controllers/product.controller');
const { authRequired, adminRequired } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// 商品列表（登录用户即可查看，普通用户只见上架商品）
router.get('/', authRequired, asyncHandler(list));
// 分类列表（必须放在 /:id 之前，避免被当作商品ID匹配）
router.get('/categories', authRequired, asyncHandler(listCategories));
router.get('/:id', authRequired, asyncHandler(detail));

// 管理操作（仅管理员）
router.post('/', authRequired, adminRequired, asyncHandler(create));
router.put('/:id', authRequired, adminRequired, asyncHandler(update));
router.delete('/:id', authRequired, adminRequired, asyncHandler(remove));
router.patch('/:id/status', authRequired, adminRequired, asyncHandler(toggleStatus));

module.exports = router;
