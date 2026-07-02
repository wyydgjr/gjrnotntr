<template>
  <div class="admin-placeholder">
    <div class="placeholder-card">
      <div class="placeholder-icon">🔧</div>
      <h2>管理后台</h2>
      <p class="placeholder-desc">
        管理后台是独立项目，需单独启动。<br />
        请在终端执行以下命令启动后台：
      </p>
      <div class="cmd-box">
        <code>cd ../ve-admin &amp;&amp; npm run dev</code>
      </div>
      <p class="placeholder-hint">启动后访问地址：</p>
      <a href="http://localhost:5174/admin/login" class="admin-url">http://localhost:5174/admin/login</a>
      <p class="placeholder-note">
        默认管理员账号：<strong>gjr</strong> / 密码：<strong>admin123</strong>
      </p>
      <div class="placeholder-actions">
        <a href="http://localhost:5174/admin/login" class="btn btn-primary">前往后台登录</a>
        <router-link to="/" class="btn btn-secondary">返回商城首页</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.placeholder-card {
  background: #fff;
  border-radius: 12px;
  padding: 48px 40px;
  width: 480px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.placeholder-card h2 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 12px;
}
.placeholder-desc {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.6;
}
.cmd-box {
  background: #1e1e2e;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}
.cmd-box code {
  color: #a6e3a1;
  font-size: 13px;
  font-family: 'Courier New', monospace;
}
.placeholder-hint {
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}
.admin-url {
  display: inline-block;
  color: #667eea;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  text-decoration: none;
}
.admin-url:hover {
  text-decoration: underline;
}
.placeholder-note {
  background: #fff3cd;
  border-radius: 6px;
  padding: 10px 14px;
  font-size: 13px;
  color: #856404;
  margin-bottom: 20px;
  line-height: 1.6;
}
.placeholder-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.btn-primary {
  background: #667eea;
  color: #fff;
}
.btn-primary:hover {
  background: #5a6fd6;
}
.btn-secondary {
  background: #e8e8e8;
  color: #333;
}
.btn-secondary:hover {
  background: #dcdcdc;
}
</style>
