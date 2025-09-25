const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 3003;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock order data
const orders = [
  { 
    id: 1, 
    userId: 1, 
    items: [{ productId: 1, quantity: 2, price: 999.99 }], 
    total: 1999.98, 
    status: 'pending', 
    createdAt: new Date().toISOString() 
  },
  { 
    id: 2, 
    userId: 2, 
    items: [{ productId: 2, quantity: 1, price: 699.99 }], 
    total: 699.99, 
    status: 'completed', 
    createdAt: new Date(Date.now() - 86400000).toISOString() 
  }
];

const payments = [
  { id: 1, orderId: 1, amount: 1999.98, status: 'pending', method: 'credit_card' },
  { id: 2, orderId: 2, amount: 699.99, status: 'completed', method: 'paypal' }
];

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Order Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all orders
app.get('/api/orders', (req, res) => {
  const { userId, status } = req.query;
  let filteredOrders = [...orders];
  
  // Filter by user ID
  if (userId) {
    filteredOrders = filteredOrders.filter(o => o.userId === parseInt(userId));
  }
  
  // Filter by status
  if (status) {
    filteredOrders = filteredOrders.filter(o => o.status === status);
  }
  
  res.json({
    success: true,
    data: filteredOrders,
    count: filteredOrders.length
  });
});

// Get order by ID
app.get('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  res.json({
    success: true,
    data: order
  });
});

// Create new order
app.post('/api/orders', (req, res) => {
  const { userId, items } = req.body;
  
  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User ID and items are required'
    });
  }
  
  // Calculate total
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const newOrder = {
    id: orders.length + 1,
    userId: parseInt(userId),
    items,
    total,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder);
  
  res.status(201).json({
    success: true,
    data: newOrder,
    message: 'Order created successfully'
  });
});

// Update order status
app.put('/api/orders/:id/status', (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body;
  
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }
  
  orders[orderIndex].status = status;
  
  res.json({
    success: true,
    data: orders[orderIndex],
    message: 'Order status updated successfully'
  });
});

// Delete order
app.delete('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id);
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  orders.splice(orderIndex, 1);
  
  res.json({
    success: true,
    message: 'Order deleted successfully'
  });
});

// Payment endpoints
app.get('/api/payments', (req, res) => {
  const { orderId, status } = req.query;
  let filteredPayments = [...payments];
  
  // Filter by order ID
  if (orderId) {
    filteredPayments = filteredPayments.filter(p => p.orderId === parseInt(orderId));
  }
  
  // Filter by status
  if (status) {
    filteredPayments = filteredPayments.filter(p => p.status === status);
  }
  
  res.json({
    success: true,
    data: filteredPayments,
    count: filteredPayments.length
  });
});

app.get('/api/payments/:id', (req, res) => {
  const paymentId = parseInt(req.params.id);
  const payment = payments.find(p => p.id === paymentId);
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }
  
  res.json({
    success: true,
    data: payment
  });
});

app.post('/api/payments', (req, res) => {
  const { orderId, amount, method } = req.body;
  
  if (!orderId || !amount || !method) {
    return res.status(400).json({
      success: false,
      message: 'Order ID, amount, and method are required'
    });
  }
  
  // Check if order exists
  const order = orders.find(o => o.id === parseInt(orderId));
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  const newPayment = {
    id: payments.length + 1,
    orderId: parseInt(orderId),
    amount: parseFloat(amount),
    status: 'pending',
    method
  };
  
  payments.push(newPayment);
  
  res.status(201).json({
    success: true,
    data: newPayment,
    message: 'Payment created successfully'
  });
});

app.put('/api/payments/:id/status', (req, res) => {
  const paymentId = parseInt(req.params.id);
  const { status } = req.body;
  
  const paymentIndex = payments.findIndex(p => p.id === paymentId);
  
  if (paymentIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }
  
  if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status'
    });
  }
  
  payments[paymentIndex].status = status;
  
  res.json({
    success: true,
    data: payments[paymentIndex],
    message: 'Payment status updated successfully'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Order Service Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🛒 Order Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
