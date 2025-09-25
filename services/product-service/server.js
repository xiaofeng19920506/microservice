const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PRODUCT_SERVICE_PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock product data
const products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', stock: 50 },
  { id: 2, name: 'Smartphone', price: 699.99, category: 'Electronics', stock: 100 },
  { id: 3, name: 'Book', price: 19.99, category: 'Books', stock: 200 },
  { id: 4, name: 'Headphones', price: 149.99, category: 'Electronics', stock: 75 }
];

const categories = [
  { id: 1, name: 'Electronics', description: 'Electronic devices and gadgets' },
  { id: 2, name: 'Books', description: 'Books and literature' },
  { id: 3, name: 'Clothing', description: 'Apparel and accessories' }
];

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Product Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all products
app.get('/api/products', (req, res) => {
  const { category, minPrice, maxPrice, search } = req.query;
  let filteredProducts = [...products];
  
  // Filter by category
  if (category) {
    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  
  // Filter by price range
  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
  }
  
  // Search by name
  if (search) {
    filteredProducts = filteredProducts.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json({
    success: true,
    data: filteredProducts,
    count: filteredProducts.length
  });
});

// Get product by ID
app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  res.json({
    success: true,
    data: product
  });
});

// Create new product
app.post('/api/products', (req, res) => {
  const { name, price, category, stock } = req.body;
  
  if (!name || !price || !category) {
    return res.status(400).json({
      success: false,
      message: 'Name, price, and category are required'
    });
  }
  
  const newProduct = {
    id: products.length + 1,
    name,
    price: parseFloat(price),
    category,
    stock: stock || 0
  };
  
  products.push(newProduct);
  
  res.status(201).json({
    success: true,
    data: newProduct,
    message: 'Product created successfully'
  });
});

// Update product
app.put('/api/products/:id', (req, res) => {
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
  
  res.json({
    success: true,
    data: products[productIndex],
    message: 'Product updated successfully'
  });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const productIndex = products.findIndex(p => p.id === productId);
  
  if (productIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Product not found'
    });
  }
  
  products.splice(productIndex, 1);
  
  res.json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Categories endpoints
app.get('/api/categories', (req, res) => {
  res.json({
    success: true,
    data: categories,
    count: categories.length
  });
});

app.get('/api/categories/:id', (req, res) => {
  const categoryId = parseInt(req.params.id);
  const category = categories.find(c => c.id === categoryId);
  
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found'
    });
  }
  
  res.json({
    success: true,
    data: category
  });
});

app.post('/api/categories', (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Name is required'
    });
  }
  
  const newCategory = {
    id: categories.length + 1,
    name,
    description: description || ''
  };
  
  categories.push(newCategory);
  
  res.status(201).json({
    success: true,
    data: newCategory,
    message: 'Category created successfully'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Product Service Error:', err);
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
  console.log(`📦 Product Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
