import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { IApiResponse } from '../../types';
require('dotenv').config();

const app = express();
const PORT = parseInt(process.env.PRODUCT_SERVICE_PORT || '3002');

// Product interface
interface IProduct {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

interface ICategory {
  id: number;
  name: string;
  description: string;
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock product data
const products: IProduct[] = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', stock: 50 },
  { id: 2, name: 'Smartphone', price: 699.99, category: 'Electronics', stock: 100 },
  { id: 3, name: 'Book', price: 19.99, category: 'Books', stock: 200 },
  { id: 4, name: 'Headphones', price: 149.99, category: 'Electronics', stock: 75 }
];

const categories: ICategory[] = [
  { id: 1, name: 'Electronics', description: 'Electronic devices and gadgets' },
  { id: 2, name: 'Books', description: 'Books and literature' },
  { id: 3, name: 'Clothing', description: 'Apparel and accessories' }
];

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'OK',
    service: 'Product Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all products
app.get('/api/products', (req: Request, res: Response) => {
  const { category, minPrice, maxPrice, search } = req.query;
  let filteredProducts = [...products];
  
  // Filter by category
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
  }
  
  // Filter by price range
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice as string));
  }
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice as string));
  }
  
  // Search by name
  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes((search as string).toLowerCase())
    );
  }
  
  const response: IApiResponse<IProduct[]> = {
    success: true,
    data: filteredProducts,
    count: filteredProducts.length
  };
  res.json(response);
});

// Get product by ID
app.get('/api/products/:id', (req: Request, res: Response) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  const response: IApiResponse<IProduct> = {
    success: true,
    data: product
  };
  res.json(response);
});

// Create new product
app.post('/api/products', (req: Request, res: Response) => {
  const { name, price, category, stock } = req.body;
  
  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: 'Name, price, and category are required'
    });
  }
  
  const newProduct: IProduct = {
    id: products.length + 1,
    name,
    price: parseFloat(price),
    category,
    stock: stock || 0
  };
  
  products.push(newProduct);
  
  const response: IApiResponse<IProduct> = {
    success: true,
    data: newProduct,
    message: 'Product created successfully'
  };
  
  res.status(201).json(response);
});

// Update product
app.put('/api/products/:id', (req: Request, res: Response) => {
  const productId = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === productId);
  
  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  const { name, price, category, stock } = req.body;
  products[productIndex] = { 
    ...products[productIndex], 
    name, 
    price: parseFloat(price), 
    category, 
    stock: parseInt(stock) 
  };
  
  const response: IApiResponse<IProduct> = {
    success: true,
    data: products[productIndex],
    message: 'Product updated successfully'
  };
  res.json(response);
});

// Delete product
app.delete('/api/products/:id', (req: Request, res: Response) => {
  const productId = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === productId);
  
  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  products.splice(productIndex, 1);
  
  const response: IApiResponse = {
    success: true,
    message: 'Product deleted successfully'
  };
  res.json(response);
});

// Categories endpoints
app.get('/api/categories', (req: Request, res: Response) => {
  const response: IApiResponse<ICategory[]> = {
    success: true,
    data: categories,
    count: categories.length
  };
  res.json(response);
});

app.get('/api/categories/:id', (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.id);
  const category = categories.find(c => c.id === categoryId);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }
  
  const response: IApiResponse<ICategory> = {
    success: true,
    data: category
  };
  res.json(response);
});

app.post('/api/categories', (req: Request, res: Response) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Name is required'
    });
  }
  
  const newCategory: ICategory = {
    id: categories.length + 1,
    name,
    description: description || ''
  };
  
  categories.push(newCategory);
  
  const response: IApiResponse<ICategory> = {
    success: true,
    data: newCategory,
    message: 'Category created successfully'
  };
  
  res.status(201).json(response);
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Product Service Error:', err);
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
  console.log(`📦 Product Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;
