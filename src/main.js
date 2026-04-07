const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
const dataFile = path.join(app.getPath('userData'), 'data.json');

// 初始化数据
function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    }
  } catch (e) {}
  return { cleaners: [], orders: [], assignments: [] };
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC 处理
ipcMain.handle('get-data', () => loadData());

ipcMain.handle('save-data', (event, data) => {
  saveData(data);
  return { success: true };
});

ipcMain.handle('add-cleaner', (event, cleaner) => {
  const data = loadData();
  cleaner.id = Date.now().toString();
  cleaner.createdAt = new Date().toISOString();
  data.cleaners.push(cleaner);
  saveData(data);
  return data;
});

ipcMain.handle('add-order', (event, order) => {
  const data = loadData();
  order.id = Date.now().toString();
  order.createdAt = new Date().toISOString();
  order.status = 'pending';
  data.orders.push(order);
  saveData(data);
  return data;
});

ipcMain.handle('assign-order', (event, { orderId, cleanerId }) => {
  const data = loadData();
  const order = data.orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'assigned';
    order.assignedTo = cleanerId;
    order.assignedAt = new Date().toISOString();
    data.assignments.push({
      orderId,
      cleanerId,
      assignedAt: order.assignedAt
    });
    saveData(data);
  }
  return data;
});

ipcMain.handle('complete-order', (event, orderId) => {
  const data = loadData();
  const order = data.orders.find(o => o.id === orderId);
  if (order) {
    order.status = 'completed';
    order.completedAt = new Date().toISOString();
    saveData(data);
  }
  return data;
});

ipcMain.handle('delete-cleaner', (event, cleanerId) => {
  const data = loadData();
  data.cleaners = data.cleaners.filter(c => c.id !== cleanerId);
  saveData(data);
  return data;
});

ipcMain.handle('delete-order', (event, orderId) => {
  const data = loadData();
  data.orders = data.orders.filter(o => o.id !== orderId);
  saveData(data);
  return data;
});
