
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import bodyParser from 'body-parser';
// import AlipaySdk from 'alipay-sdk'; // 取消注释以启用真实支付

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- 静态资源托管 (用于 Cloud Run 生产环境) ---
// 将构建好的 React 前端作为静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// --- 支付配置示例 (需要你填入真实信息) ---
/*
const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID, // 从环境变量获取
  privateKey: process.env.ALIPAY_PRIVATE_KEY, // 从环境变量获取
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY, // 从环境变量获取
});
*/

// --- API 路由 ---

// 1. 创建订单接口
app.post('/api/payment/create', async (req, res) => {
  const { payMethod, amount, orderId } = req.body;
  
  console.log(`收到支付请求: ${payMethod}, 金额: ${amount}, 订单号: ${orderId}`);

  try {
    // 模拟演示：直接返回一个模拟的支付链接或二维码
    // 在真实场景中，这里会调用 alipaySdk.exec(...) 获取真实的跳转链接
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 800));

    // 这里假设支付宝/微信返回了一个支付跳转 URL
    // 如果是 PC 端通常是二维码链接，移动端是跳转链接
    const mockPayUrl = `https://example.com/pay-mock?order=${orderId}&method=${payMethod}`;

    res.json({
      success: true,
      data: {
        orderId: orderId,
        payUrl: mockPayUrl, // 前端拿到这个 URL 进行跳转或生成二维码
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ success: false, message: '支付系统繁忙' });
  }
});

// 2. 查询订单状态接口 (前端轮询用)
app.get('/api/payment/status/:orderId', async (req, res) => {
  const { orderId } = req.params;
  
  // 在真实场景中，你需要查询数据库或调用支付网关查询接口
  // 这里我们为了演示，直接模拟 "已支付" 状态
  // 为了让演示流程顺畅，这里模拟 50% 概率成功，实际项目中请根据真实逻辑
  
  const isSuccess = true; // 模拟总是成功

  res.json({
    success: true,
    data: {
      status: isSuccess ? 'paid' : 'pending'
    }
  });
});

// 3. 支付回调 Webhook (支付宝/微信服务器会调用这个接口)
app.post('/api/payment/notify', (req, res) => {
  // 验证签名...
  // 更新数据库订单状态...
  console.log('收到支付回调:', req.body);
  res.send('success');
});

// --- 处理 React 路由 (SPA 必须) ---
// 任何不匹配 API 的请求都返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
