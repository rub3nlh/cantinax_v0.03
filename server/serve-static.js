import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// Include your API routes
import paymentRoutes from './routes/payments.js';
import usersRouter from './routes/users.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Parse JSON request body
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.resolve(__dirname, '../dist')));

// API routes
app.use('/api/payments', paymentRoutes);
app.use('/api/users', usersRouter);

// Serve the React app for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`================================================================================`);
});
