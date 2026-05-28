// ⚠️  API_URL, getCart, saveCart, updateCartCount, addToCart
//     sont définis dans main.js — NE PAS les redéclarer ici.

let allProducts = [];
let currentCategory = 'all';
let searchQuery = '';

// ── CHARGEMENT ─────────────────────────────────────────────────────────────

async function loadProducts() {
    const loading   = document.getElementById('loading');
    const container = document.getElementById('products-container');
    const noProducts = document.getElementById('no-products');

    if (loading) loading.style.display = 'block';

    try {
        const params = new URLSearchParams();
        if (currentCategory !== 'all') params.append('category', currentCategory);
        if (searchQuery)               params.append('search', searchQuery);

        const url = `${API_URL}/products${params.toString() ? '?' + params : ''}`;
        const res = await fetch(url);
        allProducts = await res.json();

        if (loading) loading.style.display = 'none';

        if (!Array.isArray(allProducts) || allProducts.length === 0) {
            if (container)   container.innerHTML = '';
            if (noProducts)  noProducts.style.display = 'block';
            return;
        }

        if (noProducts) noProducts.style.display = 'none';
        displayProducts(allProducts);
    } catch (err) {
        console.error('Erreur chargement produits:', err);
        if (loading) loading.style.display = 'none';
        if (container) container.innerHTML =
            '<p style="text-align:center;color:#ef4444;padding:2rem">Erreur de chargement des produits.</p>';
    }
}

// ── AFFICHAGE ──────────────────────────────────────────────────────────────

function displayProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = products.map((p, i) => `
        <div class="product-card" style="animation-delay:${i * 0.07}s"
             onclick="location.href='product-detail.html?id=${p._id}'">
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
                <div class="product-stock" style="font-size:.8rem;margin:4px 0 10px;color:${p.stock > 0 ? '#10b981' : '#ef4444'}">
                    <i class="fas ${p.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${p.stock > 0 ? `En stock (${p.stock})` : 'Rupture de stock'}
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
}

// ── FILTRES & RECHERCHE ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Boutons de filtre par catégorie
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            loadProducts();
        });
    });

    // Recherche avec debounce
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchQuery = this.value.trim();
                loadProducts();
            }, 500);
        });
    }

    // Paramètre de catégorie dans l'URL (ex: products.html?category=robes)
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
        currentCategory = categoryParam;
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === categoryParam);
        });
    }

    loadProducts();
});
