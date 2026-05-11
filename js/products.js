// IMPORTANT: Remplacez cette URL par votre URL backend Render
const API_URL = 'https://kaly-backend.onrender.com/api';
;

let allProducts = [];
let currentCategory = 'all';
let searchQuery = '';

// Load all products
async function loadProducts() {
    const loading = document.getElementById('loading');
    const container = document.getElementById('products-container');
    const noProducts = document.getElementById('no-products');
    
    loading.style.display = 'block';
    
    try {
        let url = `${API_URL}/products`;
        const params = new URLSearchParams();
        
        if (currentCategory !== 'all') {
            params.append('category', currentCategory);
        }
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        if (params.toString()) {
            url += '?' + params.toString();
        }
        
        const response = await fetch(url);
        allProducts = await response.json();
        
        loading.style.display = 'none';
        
        if (allProducts.length === 0) {
            container.innerHTML = '';
            noProducts.style.display = 'block';
            return;
        }
        
        noProducts.style.display = 'none';
        displayProducts(allProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        loading.style.display = 'none';
        container.innerHTML = '<p style="text-align: center; color: red; padding: 2rem;">Erreur de chargement des produits</p>';
    }
}

// Display products
function displayProducts(products) {
    const container = document.getElementById('products-container');
    
    container.innerHTML = products.map((product, index) => `
        <div class="product-card" style="animation-delay: ${index * 0.1}s" onclick="location.href='product-detail.html?id=${product._id}'">
            <div class="product-image">
                <img src="${product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/300x300?text=KALY'}" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/300x300?text=KALY'">
                ${product.featured ? '<span class="product-badge">⭐ Vedette</span>' : ''}
            </div>
            <div class="product-content">
                <div class="product-category">${product.category}</div>
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">${product.price.toLocaleString()} FCFA</div>
                <div class="product-stock ${product.stock > 0 ? '' : 'out-of-stock'}">
                    <i class="fas ${product.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${product.stock > 0 ? `En stock (${product.stock})` : 'Rupture de stock'}
                </div>
                <div class="product-actions">
                    <button onclick="event.stopPropagation(); addToCart('${product._id}')" class="btn btn-primary" ${product.stock === 0 ? 'disabled' : ''}>
                        <i class="fas fa-cart-plus"></i> Panier
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Category filters
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentCategory = this.dataset.category;
        loadProducts();
    });
});

// Search functionality
const searchInput = document.getElementById('search-input');
let searchTimeout;

searchInput.addEventListener('input', function() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchQuery = this.value.trim();
        loadProducts();
    }, 500);
});

// Check URL parameters for category
const urlParams = new URLSearchParams(window.location.search);
const categoryParam = urlParams.get('category');
if (categoryParam) {
    currentCategory = categoryParam;
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === categoryParam) {
            btn.classList.add('active');
        }
    });
}

// Get cart functions (needed for addToCart)
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
            alert('✓ Produit ajouté au panier!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Erreur lors de l\'ajout au panier');
        });
}

// Load products on page load
loadProducts();
updateCartCount();