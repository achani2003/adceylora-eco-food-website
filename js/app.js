// ==============================================================================
// ADCEYLORA ECO FOOD - Complete Inventory Management System
// Supabase Cloud Integration with Offline Fallback & Realtime Sync
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. SUPABASE CREDENTIALS CONFIGURATION
// Replace the placeholder values with your actual project keys from:
// Supabase Dashboard -> Project Settings -> API
// ------------------------------------------------------------------------------
const SUPABASE_URL = 'https://atsfczcijjyswpcotgfb.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_KVpWRMO4OYH1bcTIb_AD1g_BOPWqvtK';

let supabase = null;
let isCloudOnline = false;

if (window.supabase && SUPABASE_URL !== 'https://atsfczcijjyswpcotgfb.supabase.co/rest/v1/') {
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        isCloudOnline = true;
    } catch (e) {
        console.warn('Supabase initialization failed, falling back to local database:', e);
        isCloudOnline = false;
    }
}

const STORAGE_KEYS = {
    PRODUCTS: 'adceylora_products',
    CATEGORIES: 'adceylora_categories',
    SALES: 'adceylora_sales'
};

// Initial Seed Data reflecting ADCEYLORA ECO FOOD product line
const INITIAL_CATEGORIES = [
    { id: 'cat-1', name: 'Dehydrated Foods (විජලනය කළ ආහාර)', desc: 'විජලනය කළ කොස්, පළතුරු සහ එළවළු' },
    { id: 'cat-2', name: 'Herbal & Ayurvedic (දේශීය ඖෂධීය කුඩු)', desc: 'හීන් බෝවිටියා, මුරුංගා ආදී ඖෂධීය කුඩු' },
    { id: 'cat-3', name: 'Spices & Seasonings (කුළුබඩු)', desc: 'පිරිසිදු ලංකා කුරුඳු, ගම්මිරිස් සහ තුනපහ' },
    { id: 'cat-4', name: 'Healthy Snacks (කෙටි ආහාර)', desc: 'ස්වාභාවික බතල සහ මඤ්ඤොක්කා චිප්ස්' }
];

const INITIAL_PRODUCTS = [
    { id: 'prod-1', sku: 'DF-JACK-100', name: 'විජලනය කළ කොස් (Dehydrated Jackfruit 100g)', category: 'Dehydrated Foods (විජලනය කළ ආහාර)', cost: 350.00, price: 650.00, stock: 18, minStock: 25, dateAdded: '2026-10-15' },
    { id: 'prod-2', sku: 'HB-POW-50', name: 'හීන් බෝවිටියා කුඩු (Heen Bovitiya Powder 50g)', category: 'Herbal & Ayurvedic (දේශීය ඖෂධීය කුඩු)', cost: 420.00, price: 850.00, stock: 8, minStock: 20, dateAdded: '2026-10-18' },
    { id: 'prod-3', sku: 'MR-POW-100', name: 'මුරුංගා කොළ කුඩු (Moringa Leaf Powder 100g)', category: 'Herbal & Ayurvedic (දේශීය ඖෂධීය කුඩු)', cost: 280.00, price: 550.00, stock: 45, minStock: 15, dateAdded: '2026-10-22' },
    { id: 'prod-4', sku: 'SP-CIN-50', name: 'සැබෑ ලංකා කුරුඳු කුඩු (Pure Ceylon Cinnamon 50g)', category: 'Spices & Seasonings (කුළුබඩු)', cost: 190.00, price: 380.00, stock: 60, minStock: 20, dateAdded: '2026-10-25' },
    { id: 'prod-5', sku: 'SNK-CHIP-75', name: 'ස්වාභාවික බතල චිප්ස් (Sweet Potato Healthy Chips 75g)', category: 'Healthy Snacks (කෙටි ආහාර)', cost: 150.00, price: 300.00, stock: 4, minStock: 30, dateAdded: '2026-11-01' }
];

let appState = {
    categories: [],
    products: [],
    sales: [],
    cart: [],
    filteredSales: [],
    currentViewingInvoice: null
};

// Application Initialization
document.addEventListener('DOMContentLoaded', async () => {
    updateCloudStatusUI();
    await loadData();
    setupRealtimeSubscription();
});

function updateCloudStatusUI() {
    const badge = document.getElementById('cloudStatusBadge');
    const txt = document.getElementById('cloudStatusText');
    if (!badge || !txt) return;

    if (isCloudOnline) {
        badge.style.background = 'rgba(16, 185, 129, 0.15)';
        badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        badge.style.color = '#10b981';
        txt.innerHTML = '<i class="fa-solid fa-cloud"></i> Supabase Cloud Online';
    } else {
        badge.style.background = 'rgba(245, 158, 11, 0.15)';
        badge.style.borderColor = 'rgba(245, 158, 11, 0.3)';
        badge.style.color = '#f59e0b';
        txt.innerHTML = '<i class="fa-solid fa-hard-drive"></i> Local Storage Mode';
    }
}

// ------------------------------------------------------------------------------
// 2. DATA LOADER (SUPABASE -> LOCALSTORAGE FALLBACK)
// ------------------------------------------------------------------------------
async function loadData() {
    if (isCloudOnline && supabase) {
        try {
            // Fetch Categories
            const { data: cats, error: catErr } = await supabase.from('categories').select('*');
            if (catErr) throw catErr;

            // Fetch Products
            const { data: prods, error: prodErr } = await supabase.from('products').select('*');
            if (prodErr) throw prodErr;

            // Fetch Sales
            const { data: salesData, error: salesErr } = await supabase.from('sales').select('*').order('timestamp', { ascending: false });
            if (salesErr) throw salesErr;

            appState.categories = (cats && cats.length > 0) ? cats : INITIAL_CATEGORIES;
            appState.products = (prods || []).map(p => ({
                id: p.id,
                sku: p.sku,
                name: p.name,
                category: p.category,
                cost: Number(p.cost),
                price: Number(p.price),
                stock: Number(p.stock),
                minStock: Number(p.min_stock),
                dateAdded: p.date_added
            }));

            appState.sales = salesData || [];
            appState.filteredSales = [...appState.sales];

            // Cache to local storage
            saveLocalCache();

            renderAllViews();
            initCharts(appState.products, appState.sales);
            return;
        } catch (err) {
            console.error('Failed to load from Supabase, loading from local cache:', err);
            isCloudOnline = false;
            updateCloudStatusUI();
        }
    }

    // Fallback: LocalStorage Loader
    const savedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const savedProds = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const savedSales = localStorage.getItem(STORAGE_KEYS.SALES);

    appState.categories = savedCats ? JSON.parse(savedCats) : INITIAL_CATEGORIES;
    appState.products = savedProds ? JSON.parse(savedProds) : INITIAL_PRODUCTS;

    appState.products.forEach(p => {
        if (!p.dateAdded) p.dateAdded = new Date().toISOString().split('T')[0];
    });

    if (savedSales) {
        appState.sales = JSON.parse(savedSales);
    } else {
        // Pre-seed 7-day actual sales
        const sampleSales = [];
        const today = new Date();
        const pastDays = [
            { daysAgo: 6, items: [{ id: 'prod-1', name: 'විජලනය කළ කොස් (100g)', price: 650, qty: 15 }], total: 9750 },
            { daysAgo: 5, items: [{ id: 'prod-2', name: 'හීන් බෝවිටියා කුඩු (50g)', price: 850, qty: 12 }], total: 10200 },
            { daysAgo: 4, items: [{ id: 'prod-3', name: 'මුරුංගා කොළ කුඩු (100g)', price: 550, qty: 25 }], total: 13750 },
            { daysAgo: 3, items: [{ id: 'prod-4', name: 'කුරුඳු කුඩු (50g)', price: 380, qty: 30 }], total: 11400 },
            { daysAgo: 2, items: [{ id: 'prod-1', name: 'විජලනය කළ කොස් (100g)', price: 650, qty: 22 }, { id: 'prod-5', name: 'බතල චිප්ස් (75g)', price: 300, qty: 20 }], total: 20300 },
            { daysAgo: 1, items: [{ id: 'prod-2', name: 'හීන් බෝවිටියා කුඩු (50g)', price: 850, qty: 18 }, { id: 'prod-3', name: 'මුරුංගා කොළ කුඩු (100g)', price: 550, qty: 14 }], total: 23000 },
            { daysAgo: 0, items: [{ id: 'prod-1', name: 'විජලනය කළ කොස් (100g)', price: 650, qty: 28 }], total: 18200 }
        ];

        pastDays.forEach((p, idx) => {
            const d = new Date(today);
            d.setDate(today.getDate() - p.daysAgo);
            sampleSales.push({
                id: `ADCEY-INV-10000${idx + 1}`,
                date: d.toLocaleString(),
                timestamp: d.toISOString(),
                items: p.items,
                total: p.total,
                method: 'මුදල් (Cash)'
            });
        });
        appState.sales = sampleSales;
    }

    appState.filteredSales = [...appState.sales];
    saveLocalCache();
    renderAllViews();
    initCharts(appState.products, appState.sales);
}

function saveLocalCache() {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(appState.categories));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(appState.products));
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(appState.sales));
}

// ------------------------------------------------------------------------------
// 3. REALTIME SUBSCRIPTION FOR MULTI-DEVICE SYNC
// ------------------------------------------------------------------------------
function setupRealtimeSubscription() {
    if (!isCloudOnline || !supabase) return;

    supabase
        .channel('adceylora-cloud-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
            console.log('Realtime product update detected');
            loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
            console.log('Realtime sales update detected');
            loadData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
            console.log('Realtime categories update detected');
            loadData();
        })
        .subscribe();
}

// Navigation between views
function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(view => view.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetView = document.getElementById(`view-${tabId}`);
    if (targetView) targetView.classList.add('active');

    const activeNav = document.querySelector(`.nav-item[href="#${tabId}"]`);
    if (activeNav) activeNav.classList.add('active');

    if (tabId === 'dashboard') {
        initCharts(appState.products, appState.sales);
    }
}

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    document.getElementById('themeIcon').className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    initCharts(appState.products, appState.sales);
}

// Global Filter Search
function handleGlobalSearch(term) {
    term = term.toLowerCase();
    const rows = document.querySelectorAll('#productsTbody tr');
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// Render All Components
function renderAllViews() {
    renderKPIs();
    renderProductsTable();
    renderCategories();
    renderInventoryTable();
    renderPosGrid();
    renderQuickRestockTable();
    renderAIInsights();
    renderSalesHistory();
}

// 1. KPIs
function renderKPIs() {
    const totalSalesRev = appState.sales.reduce((acc, curr) => acc + Number(curr.total || 0), 0);
    const totalItems = appState.products.reduce((acc, p) => acc + Number(p.stock || 0), 0);
    const totalValuation = appState.products.reduce((acc, p) => acc + (p.cost * p.stock), 0);
    const lowStockItems = appState.products.filter(p => p.stock <= p.minStock);

    document.getElementById('statTotalSales').innerText = `LKR ${totalSalesRev.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('statTotalItems').innerText = totalItems;
    document.getElementById('statActiveSkus').innerText = `${appState.products.length} SKUs සක්‍රීයයි`;
    document.getElementById('statStockValuation').innerText = `LKR ${totalValuation.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('statLowStockCount').innerText = lowStockItems.length;
    document.getElementById('alertCount').innerText = lowStockItems.length;
}

// 2. Products Table
function renderProductsTable() {
    const tbody = document.getElementById('productsTbody');
    tbody.innerHTML = '';

    appState.products.forEach(p => {
        const margin = (((p.price - p.cost) / p.price) * 100).toFixed(1);
        let statusBadge = '<span class="status-pill in-stock">ප්‍රමාණවත්</span>';
        if (p.stock <= 0) {
            statusBadge = '<span class="status-pill out-of-stock">තොග අවසන්</span>';
        } else if (p.stock <= p.minStock) {
            statusBadge = '<span class="status-pill low-stock">අවම මට්ටමේ</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.sku}</strong></td>
            <td><span class="badge" style="background:#1e293b; color:#94a3b8; padding:3px 8px; border-radius:6px; font-size:11px;"><i class="fa-regular fa-calendar-check"></i> ${p.dateAdded || 'N/A'}</span></td>
            <td>${p.name}</td>
            <td><span class="badge" style="background:#374151; padding:4px 8px; border-radius:6px;">${p.category}</span></td>
            <td>LKR ${Number(p.cost).toFixed(2)}</td>
            <td>LKR ${Number(p.price).toFixed(2)}</td>
            <td><span class="text-success font-weight-bold">+${margin}%</span></td>
            <td><strong>${p.stock}</strong></td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="editProduct('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-secondary text-danger" onclick="deleteProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Categories View
function renderCategories() {
    const grid = document.getElementById('categoryCardsGrid');
    const select = document.getElementById('prodCategory');
    grid.innerHTML = '';
    select.innerHTML = '';

    appState.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.innerText = c.name;
        select.appendChild(opt);

        const items = appState.products.filter(p => p.category === c.name);
        const totalStock = items.reduce((sum, p) => sum + p.stock, 0);
        const catVal = items.reduce((sum, p) => sum + (p.cost * p.stock), 0);

        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h3 style="font-size:16px; font-weight:700;">${c.name}</h3>
                <span class="badge" style="background:#10b981; color:#fff; padding:3px 8px; border-radius:6px; font-size:11px;">${items.length} SKUs</span>
            </div>
            <p class="text-muted" style="font-size:13px; min-height:38px;">${c.desc || 'විස්තරයක් නොමැත.'}</p>
            <hr style="border-color:var(--border-color); margin:14px 0;">
            <div style="display:flex; justify-content:space-between; font-size:13px;">
                <span>මුළු තොගය: <strong>${totalStock}</strong></span>
                <span>වටිනාකම: <strong class="text-success">LKR ${catVal.toLocaleString()}</strong></span>
            </div>
        `;
        grid.appendChild(card);
    });
}

// 4. Inventory Table
function renderInventoryTable() {
    const tbody = document.getElementById('inventoryTbody');
    tbody.innerHTML = '';

    appState.products.forEach(p => {
        let statusBadge = '<span class="status-pill in-stock">ප්‍රශස්තයි</span>';
        if (p.stock <= p.minStock) {
            statusBadge = '<span class="status-pill low-stock">ඇණවුම් කරන්න</span>';
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.sku}</strong></td>
            <td>${p.name}</td>
            <td><small class="text-muted">${p.dateAdded || 'N/A'}</small></td>
            <td><span style="font-size:15px; font-weight:700;">${p.stock}</span></td>
            <td>${p.minStock}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openAdjustModal('${p.id}')">
                    <i class="fa-solid fa-sliders"></i> තොග ගැලපුම
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 5. POS Product Grid & Cart
function renderPosGrid(search = '') {
    const grid = document.getElementById('posGrid');
    grid.innerHTML = '';

    const filtered = appState.products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.sku.toLowerCase().includes(search.toLowerCase())
    );

    filtered.forEach(p => {
        const item = document.createElement('div');
        item.className = 'pos-item-card';
        item.onclick = () => addToCart(p.id);
        item.innerHTML = `
            <div>
                <small class="text-muted">${p.sku}</small>
                <h4 style="font-size:14px; margin:6px 0;">${p.name}</h4>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
                <strong class="text-success">LKR ${p.price.toFixed(2)}</strong>
                <span class="badge ${p.stock > 0 ? 'text-success' : 'text-danger'}" style="font-size:11px;">
                    ${p.stock} ඉතිරිව
                </span>
            </div>
        `;
        grid.appendChild(item);
    });
}

function addToCart(productId) {
    const prod = appState.products.find(p => p.id === productId);
    if (!prod || prod.stock <= 0) {
        alert('තොග අවසන් වී ඇති බැවින් බිල්පතට ඇතුළත් කළ නොහැක.');
        return;
    }

    const cartItem = appState.cart.find(c => c.id === productId);
    if (cartItem) {
        if (cartItem.qty >= prod.stock) {
            alert('පවතින තොග ප්‍රමාණය ඉක්මවිය නොහැක.');
            return;
        }
        cartItem.qty++;
    } else {
        appState.cart.push({ ...prod, qty: 1 });
    }
    renderCart();
}

function renderCart() {
    const cartContainer = document.getElementById('cartItems');
    cartContainer.innerHTML = '';
    let subtotal = 0;

    appState.cart.forEach(item => {
        const lineTotal = item.price * item.qty;
        subtotal += lineTotal;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <div style="flex:1;">
                <h5 style="font-size:13px; margin-bottom:4px;">${item.name}</h5>
                <small class="text-muted">LKR ${item.price.toFixed(2)} × ${item.qty}</small>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <strong>LKR ${lineTotal.toFixed(2)}</strong>
                <button class="btn btn-sm btn-secondary" onclick="changeCartQty('${item.id}', -1)">-</button>
                <button class="btn btn-sm btn-secondary" onclick="changeCartQty('${item.id}', 1)">+</button>
            </div>
        `;
        cartContainer.appendChild(row);
    });

    document.getElementById('cartSubtotal').innerText = `LKR ${subtotal.toFixed(2)}`;
    document.getElementById('cartTotal').innerText = `LKR ${subtotal.toFixed(2)}`;
}

function changeCartQty(id, delta) {
    const item = appState.cart.find(c => c.id === id);
    const prod = appState.products.find(p => p.id === id);
    if (!item) return;

    item.qty += delta;
    if (item.qty > prod.stock) item.qty = prod.stock;
    if (item.qty <= 0) {
        appState.cart = appState.cart.filter(c => c.id !== id);
    }
    renderCart();
}

function clearCart() {
    appState.cart = [];
    renderCart();
}

// POS Checkout: Syncs to Supabase & decrements stock
async function checkoutSale() {
    if (appState.cart.length === 0) {
        alert('බිල්පතක් සෑදීමට කරුණාකර අවම වශයෙන් එක් භාණ්ඩයක් තෝරන්න.');
        return;
    }

    const total = appState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const saleId = 'ADCEY-INV-' + Math.floor(100000 + Math.random() * 900000);
    const now = new Date();

    const newSale = {
        id: saleId,
        date: now.toLocaleString(),
        timestamp: now.toISOString(),
        items: [...appState.cart],
        total: total,
        method: 'මුදල් (Cash)'
    };

    if (isCloudOnline && supabase) {
        try {
            // 1. Insert sale record into Supabase
            const { error: saleErr } = await supabase.from('sales').insert([newSale]);
            if (saleErr) throw saleErr;

            // 2. Decrement stock in Supabase
            for (const item of appState.cart) {
                const prod = appState.products.find(p => p.id === item.id);
                if (prod) {
                    const newStock = Math.max(0, prod.stock - item.qty);
                    await supabase.from('products').update({ stock: newStock }).eq('id', prod.id);
                }
            }
        } catch (e) {
            console.error('Failed to sync sale to cloud, saving locally:', e);
        }
    }

    // Local update
    appState.cart.forEach(cartItem => {
        const p = appState.products.find(prod => prod.id === cartItem.id);
        if (p) p.stock = Math.max(0, p.stock - cartItem.qty);
    });

    appState.sales.unshift(newSale);
    appState.filteredSales = [...appState.sales];
    saveLocalCache();

    // Show printable invoice
    showInvoiceModal(newSale);

    appState.cart = [];
    renderCart();
    renderAllViews();
    initCharts(appState.products, appState.sales);
}

function showInvoiceModal(sale) {
    appState.currentViewingInvoice = sale;
    document.getElementById('invNumber').innerText = sale.id;
    document.getElementById('invDate').innerText = `දිනය: ${sale.date}`;
    const tbody = document.getElementById('invoiceTableBody');
    tbody.innerHTML = '';

    sale.items.forEach((it, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td><strong>${it.name}</strong></td>
            <td class="text-right">${Number(it.price).toFixed(2)}</td>
            <td class="text-center">${it.qty}</td>
            <td class="text-right">${(it.price * it.qty).toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('invSubTotalVal').innerText = `LKR ${sale.total.toFixed(2)}`;
    document.getElementById('invoiceGrandTotal').innerText = `LKR ${sale.total.toFixed(2)}`;
    document.getElementById('invoiceModal').classList.add('active');
}

// Direct Invoice PDF Download
function downloadInvoicePDF() {
    const element = document.getElementById('invoicePrintArea');
    const invoiceId = appState.currentViewingInvoice ? appState.currentViewingInvoice.id : 'Invoice';
    
    const opt = {
        margin: [8, 8, 8, 8],
        filename: `${invoiceId}_ADCEYLORA_ECO_FOOD.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
}

// 6. AI Predictive Insights Engine
function renderQuickRestockTable() {
    const tbody = document.getElementById('quickRestockTbody');
    tbody.innerHTML = '';

    const critical = appState.products.filter(p => p.stock <= p.minStock + 5);

    if (critical.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">සියලුම ADCEYLORA තොග ප්‍රශස්ත මට්ටමක පවතී. හදිසි ඇණවුම් අවශ්‍ය නොවේ.</td></tr>`;
        return;
    }

    critical.forEach(p => {
        const dailyBurnRate = Math.max(1.2, (p.minStock / 7)).toFixed(1);
        const daysRemaining = Math.max(0, Math.floor(p.stock / dailyBurnRate));
        const suggestedOrder = Math.max(p.minStock * 2 - p.stock, p.minStock);

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${p.sku}</strong></td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td><strong class="${p.stock <= p.minStock ? 'text-danger' : 'text-warning'}">${p.stock}</strong></td>
            <td>${p.minStock}</td>
            <td><span class="badge ${daysRemaining <= 3 ? 'text-danger' : 'text-warning'}">${daysRemaining} දිනකින් අවසන්</span></td>
            <td><strong class="text-success">+${suggestedOrder} ඒකක</strong></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openAdjustModal('${p.id}')">
                    <i class="fa-solid fa-truck-ramp-box"></i> Reorder
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderAIInsights() {
    const grid = document.getElementById('aiInsightsGrid');
    grid.innerHTML = '';

    appState.products.forEach(p => {
        const isDepleted = p.stock <= p.minStock;
        const estBurn = (p.minStock / 7).toFixed(1);
        const daysLeft = Math.floor(p.stock / estBurn);

        const card = document.createElement('div');
        card.className = `insight-card ${isDepleted ? 'alert-high' : 'alert-good'}`;
        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                <span class="badge" style="background:#374151; color:#fff; padding:3px 8px; border-radius:6px;">${p.sku}</span>
                <span style="font-size:12px;" class="${isDepleted ? 'text-danger' : 'text-success'} font-weight-bold">
                    ${isDepleted ? '⚠️ හදිසි ඇණවුම' : '✅ සාමාන්‍ය තත්ත්වය'}
                </span>
            </div>
            <h4 style="font-size:15px; margin-bottom:8px;">${p.name}</h4>
            <p class="text-muted" style="font-size:13px; margin-bottom:14px;">
                වත්මන් තොගය: <strong>${p.stock}</strong> | දෛනික භාවිත වේගය: <strong>~${estBurn}/දිනකට</strong>
            </p>
            <div style="background:var(--bg-sidebar); padding:10px; border-radius:8px; font-size:12px;">
                <i class="fa-solid fa-brain" style="color:var(--primary)"></i> 
                <strong>ADCEYLORA AI උපදෙස:</strong> ${isDepleted 
                    ? `තොගය ඉදිරි දින ${daysLeft} තුළ සම්පූර්ණයෙන් අවසන් විය හැක. නැවුම් අස්වැන්නෙන් ඒකක <strong>${p.minStock * 2}</strong> ක නව තොගයක් වහාම ඇසුරුම් කරන්න.`
                    : `ඉදිරි දින 14 සඳහා ප්‍රමාණවත් නිෂ්පාදන තොග පවතී. අතිරික්ත සැකසුම් අවශ්‍ය නොවේ.`}
            </div>
        `;
        grid.appendChild(card);
    });
}

// 7. Reports View with Date Filtering & PDF Export
function renderSalesHistory() {
    const tbody = document.getElementById('salesHistoryTbody');
    tbody.innerHTML = '';

    const list = appState.filteredSales || appState.sales;

    let totalRev = 0;
    let totalUnits = 0;

    list.forEach(s => {
        const itemCount = s.items.reduce((acc, it) => acc + it.qty, 0);
        totalRev += Number(s.total || 0);
        totalUnits += itemCount;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.date}</td>
            <td><strong>${s.id}</strong></td>
            <td>${itemCount} ඒකක</td>
            <td><strong>LKR ${Number(s.total).toFixed(2)}</strong></td>
            <td><span class="badge" style="background:#065f46; color:#a7f3d0; padding:4px 8px; border-radius:6px;">${s.method}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="showInvoiceModal(appState.sales.find(x => x.id === '${s.id}'))">
                    <i class="fa-solid fa-file-invoice"></i> බිල බාගන්න (View & Download)
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">තෝරාගත් කාල සීමාව තුළ විකුණුම් වාර්තා නොමැත.</td></tr>`;
    }

    document.getElementById('repFilteredRevenue').innerText = `LKR ${totalRev.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('repFilteredCount').innerText = `${list.length} ගනුදෙනු`;
    document.getElementById('repFilteredUnits').innerText = `${totalUnits} Units`;
}

// Date Filtering Function
function filterReportsByDate() {
    const startVal = document.getElementById('reportStartDate').value;
    const endVal = document.getElementById('reportEndDate').value;

    if (!startVal && !endVal) {
        alert('කරුණාකර ආරම්භක හෝ අවසන් දිනයක් තෝරන්න.');
        return;
    }

    const startDate = startVal ? new Date(startVal) : new Date('2020-01-01');
    startDate.setHours(0, 0, 0, 0);

    const endDate = endVal ? new Date(endVal) : new Date('2099-12-31');
    endDate.setHours(23, 59, 59, 999);

    appState.filteredSales = appState.sales.filter(s => {
        const sDate = new Date(s.timestamp || s.date);
        return sDate >= startDate && sDate <= endDate;
    });

    renderSalesHistory();
}

function resetReportDateFilter() {
    document.getElementById('reportStartDate').value = '';
    document.getElementById('reportEndDate').value = '';
    appState.filteredSales = [...appState.sales];
    renderSalesHistory();
}

// Download Comprehensive Sales Report as PDF
function downloadReportsPDF() {
    const list = appState.filteredSales || appState.sales;
    const startVal = document.getElementById('reportStartDate').value;
    const endVal = document.getElementById('reportEndDate').value;

    let rangeText = 'සියලුම විකුණුම් වාර්තාව';
    if (startVal || endVal) {
        rangeText = `කාල සීමාව: ${startVal || 'ආරම්භයේ'} සිට ${endVal || 'අද'} දක්වා`;
    }

    document.getElementById('pdfRepDateRange').innerText = rangeText;
    document.getElementById('pdfRepGenDate').innerText = new Date().toLocaleString();

    let totalRev = 0;
    let totalUnits = 0;
    const pdfTbody = document.getElementById('pdfReportTableBody');
    pdfTbody.innerHTML = '';

    list.forEach(s => {
        const units = s.items.reduce((acc, it) => acc + it.qty, 0);
        totalRev += Number(s.total || 0);
        totalUnits += units;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.date}</td>
            <td><strong>${s.id}</strong></td>
            <td style="text-align:center;">${units}</td>
            <td style="text-align:right;">LKR ${Number(s.total).toFixed(2)}</td>
            <td style="text-align:center;">${s.method}</td>
        `;
        pdfTbody.appendChild(tr);
    });

    document.getElementById('pdfRepTotalRev').innerText = `LKR ${totalRev.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
    document.getElementById('pdfRepTotalUnits').innerText = `${totalUnits} Units`;

    const printArea = document.getElementById('reportPrintArea');
    printArea.style.display = 'block';

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `ADCEYLORA_Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(printArea).save().then(() => {
        printArea.style.display = 'none';
    });
}

// Modal Handlers
function openProductModal() {
    document.getElementById('productForm').reset();
    document.getElementById('prodId').value = '';
    document.getElementById('prodDateAdded').value = new Date().toISOString().split('T')[0];
    document.getElementById('productModalTitle').innerText = 'නව ADCEYLORA නිෂ්පාදනයක් ඇතුළත් කරන්න';
    document.getElementById('productModal').classList.add('active');
}

function openCategoryModal() {
    document.getElementById('categoryModal').classList.add('active');
}

function openAdjustModal(productId) {
    const p = appState.products.find(x => x.id === productId);
    if (!p) return;
    document.getElementById('adjProdId').value = p.id;
    document.getElementById('adjProdDetails').innerText = `භාණ්ඩය: ${p.name} (වත්මන් තොගය: ${p.stock}) - ඇතුළත් කළ දිනය: ${p.dateAdded || 'N/A'}`;
    document.getElementById('adjustStockModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Form Submissions: Create / Update in Supabase
async function handleProductSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveProduct');
    btn.disabled = true;
    btn.innerText = 'සුරකිමින්...';

    const id = document.getElementById('prodId').value;
    const sku = document.getElementById('prodSku').value;
    const name = document.getElementById('prodName').value;
    const category = document.getElementById('prodCategory').value;
    const dateAdded = document.getElementById('prodDateAdded').value || new Date().toISOString().split('T')[0];
    const cost = parseFloat(document.getElementById('prodCost').value);
    const price = parseFloat(document.getElementById('prodPrice').value);
    const stock = parseInt(document.getElementById('prodStock').value);
    const minStock = parseInt(document.getElementById('prodMinStock').value);

    const payload = {
        sku,
        name,
        category,
        date_added: dateAdded,
        cost,
        price,
        stock,
        min_stock: minStock
    };

    if (isCloudOnline && supabase) {
        try {
            if (id) {
                const { error } = await supabase.from('products').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                payload.id = 'prod-' + Date.now();
                const { error } = await supabase.from('products').insert([payload]);
                if (error) throw error;
            }
        } catch (err) {
            alert('Cloud Sync Error: ' + err.message);
        }
    }

    // Update local cache
    if (id) {
        const p = appState.products.find(x => x.id === id);
        if (p) Object.assign(p, { sku, name, category, dateAdded, cost, price, stock, minStock });
    } else {
        appState.products.push({ id: payload.id || ('prod-' + Date.now()), sku, name, category, dateAdded, cost, price, stock, minStock });
    }

    saveLocalCache();
    btn.disabled = false;
    btn.innerText = 'සුරකින්න';
    closeModal('productModal');
    renderAllViews();
    initCharts(appState.products, appState.sales);
}

function editProduct(productId) {
    const p = appState.products.find(x => x.id === productId);
    if (!p) return;
    document.getElementById('prodId').value = p.id;
    document.getElementById('prodSku').value = p.sku;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodDateAdded').value = p.dateAdded || new Date().toISOString().split('T')[0];
    document.getElementById('prodCost').value = p.cost;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodStock').value = p.stock;
    document.getElementById('prodMinStock').value = p.minStock;
    document.getElementById('productModalTitle').innerText = 'නිෂ්පාදන විස්තර යාවත්කාලීන කරන්න';
    document.getElementById('productModal').classList.add('active');
}

async function deleteProduct(productId) {
    if (!confirm('මෙම නිෂ්පාදනය නාමාවලියෙන් ඉවත් කිරීමට ඔබට සහතිකද?')) return;

    if (isCloudOnline && supabase) {
        try {
            const { error } = await supabase.from('products').delete().eq('id', productId);
            if (error) throw error;
        } catch (e) {
            console.error('Delete error on cloud:', e);
        }
    }

    appState.products = appState.products.filter(p => p.id !== productId);
    saveLocalCache();
    renderAllViews();
    initCharts(appState.products, appState.sales);
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveCategory');
    btn.disabled = true;
    btn.innerText = 'එක් කරමින්...';

    const name = document.getElementById('catName').value;
    const desc = document.getElementById('catDesc').value;
    const newCat = { id: 'cat-' + Date.now(), name, desc };

    if (isCloudOnline && supabase) {
        try {
            const { error } = await supabase.from('categories').insert([newCat]);
            if (error) throw error;
        } catch (err) {
            alert('Cloud category insert error: ' + err.message);
        }
    }

    appState.categories.push(newCat);
    saveLocalCache();
    btn.disabled = false;
    btn.innerText = 'එක් කරන්න';
    closeModal('categoryModal');
    renderAllViews();
}

async function handleStockAdjustSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnConfirmAdjust');
    btn.disabled = true;
    btn.innerText = 'යාවත්කාලීන කරමින්...';

    const id = document.getElementById('adjProdId').value;
    const type = document.getElementById('adjType').value;
    const qty = parseInt(document.getElementById('adjQty').value);

    const prod = appState.products.find(p => p.id === id);
    if (!prod) return;

    let newStock = prod.stock;
    if (type === 'add') newStock += qty;
    else if (type === 'sub') newStock = Math.max(0, newStock - qty);
    else if (type === 'set') newStock = qty;

    if (isCloudOnline && supabase) {
        try {
            const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Cloud stock update error:', err);
        }
    }

    prod.stock = newStock;
    saveLocalCache();
    btn.disabled = false;
    btn.innerText = 'තහවුරු කරන්න';
    closeModal('adjustStockModal');
    renderAllViews();
    initCharts(appState.products, appState.sales);
}

// Export CSV Feature with Brand Name Header & dateAdded
function exportDataCSV() {
    let csv = "ADCEYLORA ECO FOOD - නිල තොග වාර්තාව (Official Inventory Report)\n";
    csv += "දිනය: " + new Date().toLocaleDateString() + "\n\n";
    csv += "SKU,එකතු කළ දිනය (Date Added),නිෂ්පාදනය (Product Name),වර්ගය (Category),පිරිවැය LKR (Cost),විකුණුම් මිල LKR (Price),වත්මන් තොගය (Stock),අවම ආරක්ෂිත සීමාව (Min Safe Stock)\n";
    
    appState.products.forEach(p => {
        csv += `"${p.sku}","${p.dateAdded || ''}","${p.name}","${p.category}",${p.cost},${p.price},${p.stock},${p.minStock}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "ADCEYLORA_ECO_FOOD_Inventory_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
