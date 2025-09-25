import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { IApiResponse } from '../../types';
require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.ORDER_SERVICE_PORT || '3003');

// Order and Payment interfaces
interface IOrderItem {
  productId: number;
  quantity: number;
  price: number;
}

interface IOrder {
  id: number;
  userId: number;
  items: IOrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed';
  createdAt: string;
}

interface IPayment {
  id: number;
  orderId: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: string;
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock order data
const orders: IOrder[] = [
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

const payments: IPayment[] = [
  { id: 1, orderId: 1, amount: 1999.98, status: 'pending', method: 'credit_card' },
  { id: 2, orderId: 2, amount: 699.99, status: 'completed', method: 'paypal' }
];

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'Order Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all orders
app.get('/api/orders', (req: Request, res: Response) => {
  const { userId, status } = req.query;
  let filteredOrders = [...orders];
  
  // Filter by user ID
  if (userId) {
    filteredOrders = filteredOrders.filter(o => o.userId === parseInt(userId as string));
  }
  
  // Filter by status
  if (status) {
    filteredOrders = filteredOrders.filter(o => o.status === status);
  }
  
  const response: IApiResponse<IOrder[]> = {
    success: true,
    data: filteredOrders,
    count: filteredOrders.length
  };
  res.json(response);
});

// Get order by ID
app.get('/api/orders/:id', (req: Request, res: Response): Response | void => {
  const orderId = parseInt(req.params.id || '0');
  const order = orders.find(o => o.id === orderId);
  
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  const response: IApiResponse<IOrder> = {
    success: true,
    data: order
  };
  res.json(response);
});

// Create new order
app.post('/api/orders', (req: Request, res: Response): Response | void => {
  const { userId, items } = req.body;
  
  if (!userId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'User ID and items are required'
    });
  }
  
  // Calculate total
  const total = items.reduce((sum: number, item: IOrderItem) => sum + (item.price * item.quantity), 0);
  
  const newOrder: IOrder = {
    id: orders.length + 1,
    userId: parseInt(userId),
    items,
    total,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  orders.push(newOrder);
  
  const response: IApiResponse<IOrder> = {
    success: true,
    data: newOrder,
    message: 'Order created successfully'
  };
  
  res.status(201).json(response);
});

// Update order status
app.put('/api/orders/:id/status', (req: Request, res: Response): Response | void => {
  const orderId = parseInt(req.params.id || '0');
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
  
  if (orders[orderIndex]) {
    orders[orderIndex].status = status as IOrder['status'];
  }
  
  const response: IApiResponse<IOrder> = {
    success: true,
    data: orders[orderIndex],
    message: 'Order status updated successfully'
  };
  res.json(response);
});

// Delete order
app.delete('/api/orders/:id', (req: Request, res: Response): Response | void => {
  const orderId = parseInt(req.params.id || '0');
  const orderIndex = orders.findIndex(o => o.id === orderId);
  
  if (orderIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }
  
  orders.splice(orderIndex, 1);
  
  const response: IApiResponse = {
    success: true,
    message: 'Order deleted successfully'
  };
  res.json(response);
});

// Payment endpoints
app.get('/api/payments', (req: Request, res: Response) => {
  const { orderId, status } = req.query;
  let filteredPayments = [...payments];
  
  // Filter by order ID
  if (orderId) {
    filteredPayments = filteredPayments.filter(p => p.orderId === parseInt(orderId as string));
  }
  
  // Filter by status
  if (status) {
    filteredPayments = filteredPayments.filter(p => p.status === status);
  }
  
  const response: IApiResponse<IPayment[]> = {
    success: true,
    data: filteredPayments,
    count: filteredPayments.length
  };
  res.json(response);
});

app.get('/api/payments/:id', (req: Request, res: Response): Response | void => {
  const paymentId = parseInt(req.params.id || '0');
  const payment = payments.find(p => p.id === paymentId);
  
  if (!payment) {
    return res.status(404).json({
      success: false,
      message: 'Payment not found'
    });
  }
  
  const response: IApiResponse<IPayment> = {
    success: true,
    data: payment
  };
  res.json(response);
});

app.post('/api/payments', (req: Request, res: Response): Response | void => {
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
  
  const newPayment: IPayment = {
    id: payments.length + 1,
    orderId: parseInt(orderId),
    amount: parseFloat(amount),
    status: 'pending',
    method
  };
  
  payments.push(newPayment);
  
  const response: IApiResponse<IPayment> = {
    success: true,
    data: newPayment,
    message: 'Payment created successfully'
  };
  
  res.status(201).json(response);
});

app.put('/api/payments/:id/status', (req: Request, res: Response): Response | void => {
  const paymentId = parseInt(req.params.id || '0');
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
  
  if (payments[paymentIndex]) {
    payments[paymentIndex].status = status as IPayment['status'];
  }
  
  const response: IApiResponse<IPayment> = {
    success: true,
    data: payments[paymentIndex],
    message: 'Payment status updated successfully'
  };
  res.json(response);
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Order Service Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🛒 Order Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
