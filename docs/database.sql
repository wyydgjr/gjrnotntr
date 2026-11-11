-- =====================================================
-- 简易电商平台 数据库初始化脚本
-- 适用：MySQL 8.0+
-- 用法：mysql -u root -p < database.sql
-- =====================================================

CREATE DATABASE IF NOT EXISTS ecommerce DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce;

-- -----------------------------------------------------
-- 1. users 用户表
-- -----------------------------------------------------
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE COMMENT '登录用户名',
    password    VARCHAR(255) NOT NULL COMMENT 'bcrypt哈希密码',
    nickname    VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
    role        ENUM('admin','user') NOT NULL DEFAULT 'user' COMMENT '角色',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- -----------------------------------------------------
-- 2. products 商品表
-- -----------------------------------------------------
CREATE TABLE products (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL COMMENT '商品名称',
    description TEXT COMMENT '商品描述',
    price       DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单价(元)',
    stock       INT NOT NULL DEFAULT 0 COMMENT '库存',
    category    VARCHAR(50) NOT NULL DEFAULT '其他' COMMENT '分类',
    image_url   VARCHAR(255) DEFAULT NULL COMMENT '图片地址',
    status      ENUM('on','off') NOT NULL DEFAULT 'on' COMMENT '上架on/下架off',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_stock_non_negative CHECK (stock >= 0),
    INDEX idx_products_status (status),
    INDEX idx_products_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- -----------------------------------------------------
-- 3. orders 订单表
-- -----------------------------------------------------
CREATE TABLE orders (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    order_no         VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
    user_id          INT NOT NULL COMMENT '下单用户',
    total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '订单总金额',
    status           ENUM('pending','paid','shipped','completed','cancelled') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
    receiver_name    VARCHAR(50) NOT NULL COMMENT '收货人',
    receiver_phone   VARCHAR(20) NOT NULL COMMENT '收货电话',
    receiver_address VARCHAR(255) NOT NULL COMMENT '收货地址',
    express_company  VARCHAR(50) DEFAULT NULL COMMENT '快递公司（发货时填写）',
    express_no       VARCHAR(64) DEFAULT NULL COMMENT '物流单号（发货时填写）',
    shipped_at       DATETIME DEFAULT NULL COMMENT '发货时间',
    remark           VARCHAR(255) DEFAULT NULL COMMENT '订单备注（用户下单或管理端补充）',
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_archived      TINYINT(1) NOT NULL DEFAULT 0 COMMENT '归档标记：1=已归档（列表隐藏，数据保留可追溯）',
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_orders_user (user_id),
    INDEX idx_orders_status (status),
    INDEX idx_orders_archived (is_archived),
    INDEX idx_orders_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- -----------------------------------------------------
-- 4. order_items 订单明细表
-- -----------------------------------------------------
CREATE TABLE order_items (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    order_id     INT NOT NULL COMMENT '所属订单',
    product_id   INT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(100) NOT NULL COMMENT '商品名称快照',
    price        DECIMAL(10,2) NOT NULL COMMENT '成交单价快照',
    quantity     INT NOT NULL DEFAULT 1 COMMENT '购买数量',
    subtotal     DECIMAL(10,2) NOT NULL COMMENT '小计',
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_order_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细表';

-- -----------------------------------------------------
-- 5. addresses 收货地址簿表（第二批新增）
-- -----------------------------------------------------
CREATE TABLE addresses (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT NOT NULL COMMENT '所属用户',
    receiver    VARCHAR(50)  NOT NULL COMMENT '收货人姓名',
    phone       VARCHAR(20)  NOT NULL COMMENT '联系电话',
    address     VARCHAR(255) NOT NULL COMMENT '收货地址',
    is_default  TINYINT(1)   NOT NULL DEFAULT 0 COMMENT '是否默认地址：1=默认，同一用户仅一个',
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_addresses_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址簿';

-- -----------------------------------------------------
-- 6. 示例商品数据
-- -----------------------------------------------------
INSERT INTO products (name, description, price, stock, category, image_url, status) VALUES
('无线机械键盘',   '87键 三模热插拔 客制化机械键盘', 299.00, 50,  '数码外设', NULL, 'on'),
('27寸 2K 显示器', 'IPS 2K 165Hz 电竞显示器',      1299.00, 20, '数码外设', NULL, 'on'),
('降噪蓝牙耳机',   '主动降噪 30小时续航',          459.00, 80,  '数码外设', NULL, 'on'),
('纯棉基础T恤',    '宽松版 纯棉 多色可选',          79.00,  200, '服饰',     NULL, 'on'),
('运动跑鞋',       '轻量缓震 透气网面',            349.00, 120, '服饰',     NULL, 'on'),
('保温杯 500ml',   '316不锈钢 长效保温',           129.00, 150, '居家生活', NULL, 'on'),
('桌面收纳盒',     '多功能分格收纳',               39.90,  300, '居家生活', NULL, 'off');

-- 管理员/普通用户账号由后端 npm run seed 创建（密码 bcrypt 加密）
