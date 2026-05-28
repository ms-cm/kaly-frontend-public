// ── CONFIG GLOBALE ─────────────────────────────────────────────────────────
// Déclaré une seule fois ici. Ne pas redéclarer dans products.js ou cart.js !
const API_URL = 'https://kaly-backend.onrender.com/api';
const WHATSAPP_NUMBER = '22379747424';

// ── PANIER ─────────────────────────────────────────────────────────────────

function getCart() {
    try {
        const cart = localStorage.getItem('kaly_cart');
        return cart ? JSON.parse(cart) : [];
    } catch {
        localStorage.removeItem('kaly_cart');
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem('kaly_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

function addToCart(productId) {
    fetch(`${API_URL}/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            const cart = getCart();
            const existing = cart.find(item => item._id === productId);
            if (existing) {
                existing.quantity++;
            } else {
                cart.push({
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0] || 'https://via.placeholder.com/100',
                    quantity: 1
                });
            }
            saveCart(cart);
            showNotification('Produit ajouté au panier ! ✓');
        })
        .catch(() => showNotification("Erreur lors de l'ajout au panier", 'error'));
}

// ── NOTIFICATION ───────────────────────────────────────────────────────────

function showNotification(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.textContent = message;
    el.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 9999;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: #fff; padding: 15px 25px; border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
        font-family: 'DM Sans', sans-serif; font-size: .9rem;
    `;
    document.body.appendChild(el);
    setTimeout(() => {
        el.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

// ── PRODUITS VEDETTE (page d'accueil) ──────────────────────────────────────

async function loadFeaturedProducts() {
    const container = document.getElementById('featured-grid');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/products?featured=true`);
        const products = await res.json();

        if (!Array.isArray(products) || products.length === 0) {
            container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--muted)">Aucun produit vedette pour le moment.</p>';
            return;
        }

        container.innerHTML = products.slice(0, 8).map(p => `
            <div class="product-card" onclick="location.href='product-detail.html?id=${p._id}'">
                <div class="product-image">
                    <img src="${p.images?.[0] || 'https://via.placeholder.com/300?text=KALY'}"
                         alt="${p.name}"
                         onerror="this.src='https://via.placeholder.com/300?text=KALY'">
                    ${p.featured ? '<span class="product-badge">⭐ Vedette</span>' : ''}
                </div>
                <div class="product-content">
                    <div class="product-category">${p.category}</div>
                    <h3 class="product-title">${p.name}</h3>
                    <div class="product-footer">
                        <div class="product-price">${p.price.toLocaleString()} FCFA</div>
                        <div class="product-stock-dot" style="${p.stock === 0 ? 'background:#ef4444' : ''}"></div>
                    </div>
                    <button class="add-btn"
                        onclick="event.stopPropagation(); addToCart('${p._id}')"
                        ${p.stock === 0 ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
                        <i class="fas fa-cart-plus"></i>
                        ${p.stock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Erreur chargement produits:', err);
        container.innerHTML = '<p style="text-align:center;padding:2rem;color:#ef4444">Erreur de chargement des produits.</p>';
    }
}

// ── AUTH HEADER ────────────────────────────────────────────────────────────
// Gère l'affichage du menu utilisateur / boutons connexion dans le header

function initAuthHeader() {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('kaly_user'));
    } catch {
        localStorage.removeItem('kaly_user');
    }

    const authArea     = document.querySelector('.auth-area');
    const userMenu     = document.querySelector('.user-menu');
    const guestButtons = document.querySelector('.guest-buttons');

    if (!authArea) return; // pas de header sur cette page

    if (user) {
        // Affiche le menu utilisateur, cache les boutons invité
        if (guestButtons) guestButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'flex';
            const nameEl = userMenu.querySelector('.user-name');
            const avatarEl = userMenu.querySelector('.user-avatar');
            const greetingEl = userMenu.querySelector('.dropdown-greeting + .dropdown-username');
            if (nameEl) nameEl.textContent = user.name || user.email || 'Mon compte';
            if (avatarEl) avatarEl.textContent = (user.name || user.email || 'U')[0].toUpperCase();
            if (greetingEl) greetingEl.textContent = user.name || user.email;
        }
    } else {
        // Affiche les boutons invité, cache le menu utilisateur
        if (userMenu)     userMenu.style.display = 'none';
        if (guestButtons) guestButtons.style.display = 'flex';
    }
}

function logout() {
    localStorage.removeItem('kaly_user');
    localStorage.removeItem('kaly_token');
    window.location.href = 'index.html';
}

// Toggle dropdown utilisateur
function toggleUserDropdown() {
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown) dropdown.classList.toggle('open');
}

// Fermer le dropdown si clic en dehors
document.addEventListener('click', e => {
    const trigger = document.querySelector('.user-trigger');
    const dropdown = document.querySelector('.user-dropdown');
    if (dropdown && trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
    }
});

// ── MENU MOBILE ────────────────────────────────────────────────────────────

function toggleMobileNav() {
    const nav = document.getElementById('mobileNav');
    if (nav) nav.classList.toggle('open');
}

function closeMobileNav() {
    const nav = document.getElementById('mobileNav');
    if (nav) nav.classList.remove('open');
}

// ── ANIMATIONS CSS ─────────────────────────────────────────────────────────

(function injectAnimations() {
    const s = document.createElement('style');
    s.textContent = `
        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(100px); }
            to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOutRight {
            from { opacity: 1; transform: translateX(0); }
            to   { opacity: 0; transform: translateX(100px); }
        }
    `;
    document.head.appendChild(s);
})();

// ── INIT ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initAuthHeader();
    loadFeaturedProducts();
});
