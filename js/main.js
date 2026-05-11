// IMPORTANT: Remplacez cette URL par votre URL backend Render
const API_URL = 'https://kaly-backend.onrender.com/api';
;
const WHATSAPP_NUMBER = '22379747424';

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem('kaly_cart');
    return cart ? JSON.parse(cart) : [];
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem('kaly_cart', JSON.stringify(cart));
    updateCartCount();
}

// Update cart count in header
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCounts = document.querySelectorAll('.cart-count');
    cartCounts.forEach(count => {
        count.textContent = totalItems;
    });
}

// Add to cart
function addToCart(productId) {
    fetch(`${API_URL}/products/${productId}`)
        .then(res => res.json())
        .then(product => {
            const cart = getCart();
            const existingItem = cart.find(item => item._id === productId);
            
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({
                    _id: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/100',
                    quantity: 1
                });
            }
            
            saveCart(cart);
            showNotification('Produit ajouté au panier! ✓');
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Erreur lors de l\'ajout au panier', 'error');
        });
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Load featured products on homepage
async function loadFeaturedProducts() {
    const container = document.getElementById('featured-grid');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_URL}/products?featured=true`);
        const products = await response.json();
        
        container.innerHTML = products.slice(0, 8).map(product => `
            <div class="product-card" onclick="location.href='product-detail.html?id=${product._id}'">
                <div class="product-image">
                    <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300?text=KALY'}" 
                         alt="${product.name}">
                    ${product.featured ? '<span class="product-badge">⭐ Vedette</span>' : ''}
                </div>
                <div class="product-content">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">${product.price.toLocaleString()} FCFA</div>
                    <div class="product-stock ${product.stock > 0 ? '' : 'out-of-stock'}">
                        <i class="fas ${product.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${product.stock > 0 ? 'En stock' : 'Rupture de stock'}
                    </div>
                    <div class="product-actions">
                        <button onclick="event.stopPropagation(); addToCart('${product._id}')" class="btn btn-primary">
                            <i class="fas fa-cart-plus"></i> Panier
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p style="text-align:center;padding:2rem;">Erreur de chargement des produits</p>';
    }
}

// Initialize
if (document.getElementById('featured-grid')) {
    loadFeaturedProducts();
}
updateCartCount();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);