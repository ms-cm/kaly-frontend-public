// ⚠️  API_URL, WHATSAPP_NUMBER, getCart, saveCart, updateCartCount
//     sont définis dans main.js — NE PAS les redéclarer ici.

let appliedPromo = null;

// ── CHARGEMENT DU PANIER ───────────────────────────────────────────────────

function loadCart() {
    const cart       = getCart();
    const cartContent  = document.getElementById('cart-content');
    const emptyCart    = document.getElementById('empty-cart');
    const cartSummary  = document.getElementById('cart-summary');

    if (!cartContent || !emptyCart || !cartSummary) return;

    if (cart.length === 0) {
        cartContent.style.display  = 'none';
        cartSummary.style.display  = 'none';
        emptyCart.style.display    = 'block';
        return;
    }

    emptyCart.style.display    = 'none';
    cartContent.style.display  = 'block';
    cartSummary.style.display  = 'block';

    cartContent.innerHTML = cart.map((item, i) => `
        <div class="cart-item" style="animation-delay:${i * 0.1}s">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}"
                     onerror="this.src='https://via.placeholder.com/100?text=KALY'">
            </div>
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <div class="cart-item-price">${item.price.toLocaleString()} FCFA</div>
                <div class="quantity-control">
                    <button onclick="updateQuantity('${item._id}', -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item._id}', 1)">+</button>
                </div>
                <div style="margin-top:.5rem;font-weight:700;color:var(--dark)">
                    Sous-total : ${(item.price * item.quantity).toLocaleString()} FCFA
                </div>
            </div>
            <div class="cart-item-actions">
                <button class="remove-btn" onclick="removeFromCart('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    updateCartSummary();
}

// ── QUANTITÉS ──────────────────────────────────────────────────────────────

function updateQuantity(productId, change) {
    const cart = getCart();
    const item = cart.find(i => i._id === productId);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    saveCart(cart);
    loadCart();
}

function removeFromCart(productId) {
    saveCart(getCart().filter(i => i._id !== productId));
    loadCart();
}

// ── RÉSUMÉ ─────────────────────────────────────────────────────────────────

function updateCartSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const subtotalEl  = document.getElementById('subtotal');
    const totalEl     = document.getElementById('total');
    const discountRow = document.getElementById('discount-row');

    if (subtotalEl) subtotalEl.textContent = `${subtotal.toLocaleString()} FCFA`;

    let total = subtotal;

    if (appliedPromo) {
        const discount = (subtotal * appliedPromo.discount) / 100;
        total = subtotal - discount;
        if (discountRow) {
            discountRow.style.display = 'flex';
            const pct = document.getElementById('discount-percent');
            const amt = document.getElementById('discount-amount');
            if (pct) pct.textContent = appliedPromo.discount;
            if (amt) amt.textContent = `−${discount.toLocaleString()} FCFA`;
        }
    } else {
        if (discountRow) discountRow.style.display = 'none';
    }

    if (totalEl) totalEl.textContent = `${total.toLocaleString()} FCFA`;
}

// ── CODE PROMO ─────────────────────────────────────────────────────────────

async function applyPromo() {
    const promoInput = document.getElementById('promo-code');
    const messageDiv = document.getElementById('promo-message');
    if (!promoInput || !messageDiv) return;

    const promoCode = promoInput.value.trim().toUpperCase();
    if (!promoCode) {
        messageDiv.innerHTML = '<span style="color:#ef4444">Veuillez entrer un code promo.</span>';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/promo/${promoCode}`);
        if (res.ok) {
            const data = await res.json();
            appliedPromo = { code: promoCode, discount: data.discount };
            messageDiv.innerHTML = `<span style="color:#10b981">✓ Code appliqué ! −${data.discount}%</span>`;
        } else {
            appliedPromo = null;
            messageDiv.innerHTML = '<span style="color:#ef4444">Code promo invalide ou expiré.</span>';
        }
    } catch {
        messageDiv.innerHTML = '<span style="color:#ef4444">Erreur lors de la vérification.</span>';
    }

    updateCartSummary();
}

// ── COMMANDE WHATSAPP ──────────────────────────────────────────────────────

function checkoutWhatsApp() {
    const cart = getCart();
    if (cart.length === 0) return;

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let total = subtotal;
    let msg = `🛍️ *Nouvelle Commande KALY*\n\n📦 *Produits :*\n`;

    cart.forEach(item => {
        msg += `\n• ${item.name}\n`;
        msg += `  Prix : ${item.price.toLocaleString()} FCFA\n`;
        msg += `  Qté : ${item.quantity}\n`;
        msg += `  Sous-total : ${(item.price * item.quantity).toLocaleString()} FCFA\n`;
    });

    msg += `\n💰 *Récapitulatif :*\nSous-total : ${subtotal.toLocaleString()} FCFA\n`;

    if (appliedPromo) {
        const discount = (subtotal * appliedPromo.discount) / 100;
        total = subtotal - discount;
        msg += `Code promo (${appliedPromo.code}) : −${appliedPromo.discount}%\n`;
        msg += `Réduction : −${discount.toLocaleString()} FCFA\n`;
    }

    msg += `\n*TOTAL : ${total.toLocaleString()} FCFA*\n\n📞 Je souhaite finaliser ma commande !`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ── INIT ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    loadCart();
});
