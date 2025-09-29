// MongoDB initialization script
db = db.getSiblingDB('microservice_db');

// Create collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('payments');
db.createCollection('categories');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "price": 1 });
db.orders.createIndex({ "userId": 1 });
db.orders.createIndex({ "status": 1 });
db.orders.createIndex({ "createdAt": 1 });

// Insert sample data
db.users.insertMany([
  {
    _id: ObjectId(),
    username: "admin",
    email: "admin@example.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7.8.9.0",
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    username: "user1",
    email: "user1@example.com",
    password: "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/4.5.6.7.8.9.0",
    role: "user",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

db.categories.insertMany([
  {
    _id: ObjectId(),
    name: "Electronics",
    description: "Electronic devices and gadgets",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Clothing",
    description: "Fashion and apparel",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Books",
    description: "Books and literature",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

db.products.insertMany([
  {
    _id: ObjectId(),
    name: "Smartphone",
    description: "Latest smartphone with advanced features",
    price: 699.99,
    category: "Electronics",
    stock: 50,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "Laptop",
    description: "High-performance laptop for work and gaming",
    price: 1299.99,
    category: "Electronics",
    stock: 25,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: ObjectId(),
    name: "T-Shirt",
    description: "Comfortable cotton t-shirt",
    price: 19.99,
    category: "Clothing",
    stock: 100,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]);

print("Database initialization completed successfully!");
