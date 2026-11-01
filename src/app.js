const express = require('express');
const todoRoutes = require('./routes/todoRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy.'
  });
});

app.use('/todos', todoRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
