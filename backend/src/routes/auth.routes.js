const express = require('express');
const {
  register, login, profile, changePassword, changeNickname,
} = require('../controllers/auth.controller');
const { authRequired } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// 公开接口
router.post('/register', asyncHandler(register));   // 注册
router.post('/login', asyncHandler(login));         // 登录

// 需要登录
router.get('/profile', authRequired, asyncHandler(profile)); // 获取个人信息
router.put('/profile', authRequired, asyncHandler(changeNickname));           // 修改昵称
router.post('/change-nickname', authRequired, asyncHandler(changeNickname));  // 修改昵称（别名）
router.post('/change-password', authRequired, asyncHandler(changePassword));  // 修改密码

module.exports = router;
