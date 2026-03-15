const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory store for items
let items = [
  { id: 1, title: 'First item', completed: false },
  { id: 2, title: 'Second item', completed: true },
];
let nextId = 3;

// GET /api/items - retrieve all items
app.get('/api/items', (req, res) => {
  res.json(items);
});

// GET /api/items/:id - retrieve a single item
app.get('/api/items/:id', (req, res) => {
  const item = items.find((i) => i.id === parseInt(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  res.json(item);
});

// POST /api/items - create a new item
app.post('/api/items', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newItem = { id: nextId++, title: title.trim(), completed: false };
  items.push(newItem);
  res.status(201).json(newItem);
});

// PUT /api/items/:id - update an existing item
app.put('/api/items/:id', (req, res) => {
  const index = items.findIndex((i) => i.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  const { title, completed } = req.body;
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    items[index].title = title.trim();
  }
  if (completed !== undefined) {
    items[index].completed = Boolean(completed);
  }
  res.json(items[index]);
});

// DELETE /api/items/:id - delete an item
app.delete('/api/items/:id', (req, res) => {
  const index = items.findIndex((i) => i.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found' });
  }
  const deleted = items.splice(index, 1)[0];
  res.json(deleted);
});

// Health-check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Cank backend listening on http://localhost:${PORT}`);
});

module.exports = app;
