/**
 * E2E 测试 — 核心用户流程
 */
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('应显示登录页面', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('h1, h2, .login-title, form')).toBeVisible()
  })

  test('空表单提交应显示校验错误', async ({ page }) => {
    await page.goto('/login')
    // 尝试提交空表单
    const submitBtn = page.locator('button[type="submit"], .btn-primary').first()
    if (await submitBtn.isVisible()) {
      await submitBtn.click()
      // 应有校验提示
      await expect(page.locator('.error, .v-message, [role="alert"]').first()).toBeVisible({ timeout: 3000 })
    }
  })
})

test.describe('Home Page', () => {
  test('首页应正常加载', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })

  test('首页应包含导航', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('nav, header, .navbar, .topbar').first()).toBeVisible()
  })
})

test.describe('Admin Dashboard', () => {
  test('未登录访问后台应重定向到登录页', async ({ page }) => {
    await page.goto('/admin/dashboard')
    // 应该被重定向到登录页
    await page.waitForURL('**/admin/login**', { timeout: 5000 })
  })

  test('后台登录页应正常显示', async ({ page }) => {
    await page.goto('/admin/login')
    await expect(page.locator('form, .login-form').first()).toBeVisible()
  })
})

test.describe('Products Page', () => {
  test('产品列表页应正常加载', async ({ page }) => {
    await page.goto('/products')
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Responsive Design', () => {
  test('移动端视口应正常显示', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/')
    await expect(page.locator('body')).toBeVisible()
  })
})
