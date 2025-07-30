// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');

const app = express();

/* ---------------------------- Middlewares ---------------------------- */
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
app.use(cors({ origin: '*' }));
app.use(express.json());

// Static files
app.use('/image/products', express.static('public/products'));
app.use('/image/category', express.static('public/category'));
app.use('/image/poster', express.static('public/posters'));

/* --------------------------- MongoDB connect ------------------------- */
const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  console.error('❌ Missing MONGO_URL in .env');
  process.exit(1);
}
mongoose.connect(MONGO_URL);
mongoose.connection.on('error', (err) => console.error('MongoDB error:', err));
mongoose.connection.once('open', () => console.log('✅ Connected to Database'));

/* ------------------------------- Routes ----------------------------- */
// CHÚ Ý: file là ./routes/user.js
app.use('/users', require('./routes/user'));
app.use('/categories', require('./routes/category'));
app.use('/subCategories', require('./routes/subCategory'));
app.use('/brands', require('./routes/brand'));
app.use('/variantTypes', require('./routes/variantType'));
app.use('/variants', require('./routes/variant'));
app.use('/products', require('./routes/product'));
app.use('/couponCodes', require('./routes/couponCode'));
app.use('/posters', require('./routes/poster'));
app.use('/orders', require('./routes/order'));
app.use('/payment', require('./routes/payment'));
app.use('/notification', require('./routes/notification'));

app.get('/', asyncHandler(async (_req, res) => {
  res.json({ success: true, message: 'API working successfully', data: null });
}));

/* ------------------------- 404 & Error handler ---------------------- */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.originalUrl}` });
});
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: err.message || 'Server error', data: null });
});

/* ------------------------------ Start ------------------------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
