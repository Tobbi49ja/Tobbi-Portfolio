const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const apiRoutes = require('./email-routes/api');

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../client')));

// API Routes
app.use('/api', apiRoutes);

// Serve static HTML pages
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
  res.sendFile(path.join(__dirname, '../client', 'preview', 'index.html'));
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../client', 'error', 'index.html'));
});

// ✅ Render and Localhost: normal server start
// ✅ Vercel: skip .listen(), export instead
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

// ✅ Export app for Vercel serverless functions
module.exports = app;
