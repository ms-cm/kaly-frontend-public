// IMPORTANT: Remplacez cette URL par votre URL backend Render
const API_URL = 'https://kaly-backend.onrender.com/api';
const WHATSAPP_NUMBER = '22379747424';

let appliedPromo = null;

// Get cart functions
function getCart() {
    const cart = localStorage.getItem('kaly_cart');
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem('kaly_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCounts = document.querySelectorAll('.cart-count');
    cartCounts.forEach(count => {
        count.textContent = totalItems;
    });
}

// Load cart items
function loadCart() {
    const cart = getCart();
    const cartContent = document.getElementById('cart-content');
    const emptyCart = document.getElementById('empty-cart');
    const cartSummary = document.getElementById('cart-summary');
    
    if (cart.length === 0) {
        cartContent.style.display = 'none';
        cartSummary.style.display = 'none';
        emptyCart.style.display = 'block';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartContent.style.display = 'block';
    cartSummary.style.display = 'block';
    
    cartContent.innerHTML = cart.map((item, index) => `
        <div class="cart-item" style="animation-delay: ${index * 0.1}s">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/100?text=KALY'">
            </div>
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <div class="cart-item-price">${item.price.toLocaleString()} FCFA</div>
                <div class="quantity-control">
                    <button onclick="updateQuantity('${item._id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item._id}', 1)">+</button>
                </div>
                <div style="margin-top: 0.5rem; font-weight: bold; color: var(--dark);">
                    Sous-total: ${(item.price * item.quantity).toLocaleString()} FCFA
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

// Update quantity
function updateQuantity(productId, change) {
    const cart = getCart();
    const item = cart.find(i => i._id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        saveCart(cart);
        loadCart();
    }
}

// Remove from cart
function removeFromCart(productId) {
    const cart = getCart();
    const newCart = cart.filter(item => item._id !== productId);
    saveCart(newCart);
    loadCart();
}

// Update cart summary
function updateCartSummary() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    document.getElementById('subtotal').textContent = `${subtotal.toLocaleString()} FCFA`;
    
    let total = subtotal;
    let discount = 0;
    
    if (appliedPromo) {
        discount = (subtotal * appliedPromo.discount) / 100;
        total = subtotal - discount;
        
        document.getElementById('discount-row').style.display = 'flex';
        document.getElementById('discount-percent').textContent = appliedPromo.discount;
        document.getElementById('discount-amount').textContent = `-${discount.toLocaleString()} FCFA`;
    } else {
        document.getElementById('discount-row').style.display = 'none';
    }
    
    document.getElementById('total').textContent = `${total.toLocaleString()} FCFA`;
}

// Apply promo code
async function applyPromo() {
    const promoInput = document.getElementById('promo-code');
    const promoCode = promoInput.value.trim().toUpperCase();
    const messageDiv = document.getElementById('promo-message');
    
    if (!promoCode) {
        messageDiv.innerHTML = '<span style="color: #ef4444;">Veuillez entrer un code promo</span>';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/promo/${promoCode}`);
        
        if (response.ok) {
            const data = await response.json();
            appliedPromo = { code: promoCode, discount: data.discount };
            messageDiv.innerHTML = `<span style="color: #10b981;">✓ Code promo appliqué! -${data.discount}%</span>`;
            updateCartSummary();
        } else {
            messageDiv.innerHTML = '<span style="color: #ef4444;">Code promo invalide ou expiré</span>';
            appliedPromo = null;
            updateCartSummary();
        }
    } catch (error) {
        console.error('Error:', error);
        messageDiv.innerHTML = '<span style="color: #ef4444;">Erreur lors de la vérification du code</span>';
    }
}

// Checkout via WhatsApp
function checkoutWhatsApp() {
    const cart = getCart();
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let total = subtotal;
    
    let message = `🛍️ *Nouvelle Commande KALY*\n\n`;
    message += `📦 *Produits:*\n`;
    
    cart.forEach(item => {
        message += `\n• ${item.name}\n`;
        message += `  Prix: ${item.price.toLocaleString()} FCFA\n`;
        message += `  Quantité: ${item.quantity}\n`;
        message += `  Sous-total: ${(item.price * item.quantity).toLocaleString()} FCFA\n`;
    });
    
    message += `\n💰 *Récapitulatif:*\n`;
    message += `Sous-total: ${subtotal.toLocaleString()} FCFA\n`;
    
    if (appliedPromo) {
        const discount = (subtotal * appliedPromo.discount) / 100;
        total = subtotal - discount;
        message += `Code promo (${appliedPromo.code}): -${appliedPromo.discount}%\n`;
        message += `Réduction: -${discount.toLocaleString()} FCFA\n`;
    }
    
    message += `\n*TOTAL: ${total.toLocaleString()} FCFA*\n\n`;
    message += `📞 Je souhaite finaliser ma commande!`;
    
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Initialize
loadCart();
updateCartCount();
