const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const apiRoutes = require('./routes/api');

dotenv.config();

// // Debug environment variables
// console.log('EMAIL_USER:', process.env.EMAIL_USER.urlencoded);
// console.log('EMAIL_PASS:', process.env.EMAIL_PASS.urlencoded);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api', apiRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'home', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'about', 'index.html'));
});

app.get('/projects', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'projects', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'contact', 'index.html'));
});

app.get('/cv', (req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'cv', 'index.html'));
});
app.get('/preview-index.html', (req, res) => {
  const filePath = path.join(__dirname, '../client', 'preview', 'index.html');
  res.sendFile(filePath);
});

// Handle 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../client', 'error', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});