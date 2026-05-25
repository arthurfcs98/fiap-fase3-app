const API_BASE = '/api/public/service-orders';

const $ = (sel) => document.querySelector(sel);
const show = (el) => { el.style.display = ''; };
const hide = (el) => { el.style.display = 'none'; };

let currentToken = null;
let currentOrderNumber = null;

// -- Init --
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const orderNumber = params.get('orderNumber');

  if (token && orderNumber) {
    verifyTokenAndLoad(token, orderNumber);
  } else {
    showAccessForm();
  }

  $('#form-access').addEventListener('submit', handleAccessSubmit);
  $('#btn-approve').addEventListener('click', () => handleAction('approve'));
  $('#btn-reject').addEventListener('click', () => handleAction('reject'));
  $('#btn-logout').addEventListener('click', handleLogout);
});

// -- Access Form --
function showAccessForm() {
  show($('#access-form'));
  hide($('#order-details'));
  hide($('#loading'));
}

async function handleAccessSubmit(e) {
  e.preventDefault();
  const document = $('#document').value.trim();
  const orderNumber = $('#orderNumber').value.trim();

  if (!document || !orderNumber) return;

  hide($('#form-error'));
  showLoading();

  try {
    const res = await fetch(`${API_BASE}/access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document, orderNumber }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.description || 'Dados inválidos. Verifique CPF/CNPJ e número da OS.');
    }

    currentToken = data.token;
    currentOrderNumber = orderNumber;

    // Update URL without reload
    const url = new URL(window.location);
    url.searchParams.set('token', data.token);
    url.searchParams.set('orderNumber', orderNumber);
    window.history.replaceState({}, '', url);

    renderOrder(data.order);
  } catch (err) {
    hideLoading();
    showAccessForm();
    const errorEl = $('#form-error');
    errorEl.textContent = err.message;
    show(errorEl);
  }
}

// -- Token Verification --
async function verifyTokenAndLoad(token, orderNumber) {
  showLoading();

  try {
    const res = await fetch(`${API_BASE}/verify-token?token=${encodeURIComponent(token)}&orderNumber=${encodeURIComponent(orderNumber)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error('Token expirado ou inválido');
    }

    currentToken = token;
    currentOrderNumber = orderNumber;
    renderOrder(data.order);
  } catch {
    hideLoading();
    showAccessForm();
    const errorEl = $('#form-error');
    errorEl.textContent = 'Link expirado. Informe seu CPF/CNPJ e número da OS para continuar.';
    show(errorEl);
    $('#orderNumber').value = orderNumber || '';
  }
}

// -- Render Order --
function renderOrder(order) {
  hideLoading();
  hide($('#access-form'));
  show($('#order-details'));

  $('#os-number').textContent = order.orderNumber;

  const statusEl = $('#os-status');
  statusEl.textContent = order.statusLabel;
  statusEl.className = `status-badge status-${order.status}`;

  $('#os-vehicle').textContent = order.vehicleDescription || `${order.vehicle?.brand || ''} ${order.vehicle?.model || ''}`.trim();
  $('#os-plate').textContent = order.vehiclePlate || order.vehicle?.licensePlate || '';
  $('#os-date').textContent = new Date(order.createdAt).toLocaleDateString('pt-BR');
  $('#os-total').textContent = formatCurrency(order.totalAmount);

  // Services
  const services = order.services || [];
  if (services.length > 0) {
    show($('#services-section'));
    $('#services-list').innerHTML = services.map(s => `
      <tr>
        <td>${s.serviceName || s.serviceCode}</td>
        <td>${s.quantity}</td>
        <td>${formatCurrency(s.unitPrice)}</td>
        <td>${formatCurrency(s.subtotal)}</td>
      </tr>
    `).join('');
  } else {
    hide($('#services-section'));
  }

  // Parts
  const parts = order.parts || [];
  if (parts.length > 0) {
    show($('#parts-section'));
    $('#parts-list').innerHTML = parts.map(p => `
      <tr>
        <td>${p.partName || p.partCode}</td>
        <td>${p.quantity}</td>
        <td>${formatCurrency(p.unitPrice)}</td>
        <td>${formatCurrency(p.subtotal)}</td>
      </tr>
    `).join('');
  } else {
    hide($('#parts-section'));
  }

  // Show approval buttons only if awaiting approval
  if (order.status === 'AWAITING_APPROVAL') {
    show($('#approval-actions'));
  } else {
    hide($('#approval-actions'));
  }
}

// -- Actions --
async function handleAction(action) {
  if (!currentOrderNumber) return;

  const btn = action === 'approve' ? $('#btn-approve') : $('#btn-reject');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Processando...';

  try {
    const res = await fetch(`${API_BASE}/${currentOrderNumber}/${action}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error?.description || 'Erro ao processar ação');
    }

    // Reload order data
    await verifyTokenAndLoad(currentToken, currentOrderNumber);
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function handleLogout() {
  currentToken = null;
  currentOrderNumber = null;
  window.history.replaceState({}, '', '/orders');
  showAccessForm();
  hide($('#form-error'));
  $('#document').value = '';
  $('#orderNumber').value = '';
}

// -- Helpers --
function showLoading() {
  hide($('#access-form'));
  hide($('#order-details'));
  show($('#loading'));
}

function hideLoading() {
  hide($('#loading'));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}
