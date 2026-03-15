const API_BASE = 'http://localhost:5000/api';

const list = document.getElementById('items-list');
const form = document.getElementById('add-form');
const titleInput = document.getElementById('new-title');
const statusEl = document.getElementById('status');

function showStatus(message, isError = true) {
  statusEl.textContent = message;
  statusEl.className = 'status' + (isError ? '' : ' success');
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.className = 'status';
  }, 3000);
}

function renderItems(items) {
  list.innerHTML = '';
  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-message';
    li.textContent = 'No items yet. Add one above!';
    list.appendChild(li);
    return;
  }
  items.forEach((item) => {
    const li = document.createElement('li');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = item.completed;
    checkbox.setAttribute('aria-label', `Mark "${item.title}" as ${item.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleItem(item.id, checkbox.checked));

    const span = document.createElement('span');
    span.className = 'item-title' + (item.completed ? ' completed' : '');
    span.textContent = item.title;

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.textContent = 'Delete';
    delBtn.setAttribute('aria-label', `Delete "${item.title}"`);
    delBtn.addEventListener('click', () => deleteItem(item.id));

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });
}

async function loadItems() {
  try {
    const res = await fetch(`${API_BASE}/items`);
    if (!res.ok) throw new Error('Failed to load items');
    const data = await res.json();
    renderItems(data);
  } catch (err) {
    showStatus('Could not connect to the backend. Make sure it is running on port 5000.');
  }
}

async function addItem(title) {
  try {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add item');
    }
    showStatus('Item added.', false);
    await loadItems();
  } catch (err) {
    showStatus(err.message);
  }
}

async function toggleItem(id, completed) {
  try {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });
    if (!res.ok) throw new Error('Failed to update item');
    await loadItems();
  } catch (err) {
    showStatus(err.message);
  }
}

async function deleteItem(id) {
  try {
    const res = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete item');
    showStatus('Item deleted.', false);
    await loadItems();
  } catch (err) {
    showStatus(err.message);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  titleInput.value = '';
  await addItem(title);
});

// Initial load
loadItems();
