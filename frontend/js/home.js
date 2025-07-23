$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');

    if (!token || !userId) return window.location.href = "/frontend/Userhandling/login.html";

    let allProducts = []; // Store all products for filtering
    let filteredProducts = []; // Store filtered products for infinite scroll
    let displayedProducts = []; // Products currently displayed
    let currentUser = null; // Store current user data
    let currentPage = 0; // Current page for infinite scroll
    const itemsPerPage = 20; // Items per page
    let isLoading = false; // Prevent multiple simultaneous loads

    // Verify customer and load initial data
    $.ajax({
        url: `http://localhost:4000/api/v1/profile/${userId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        success: res => {
            if (!res.user || res.user.role !== 'customer') {
                sessionStorage.clear();
                return window.location.href = "/frontend/Userhandling/login.html";
            }
            currentUser = res.user;
            // Update customer name in the UI
            updateCustomerName(currentUser.name);
            loadProducts();
            loadCartCount(); // Load initial cart count
        },
        error: () => {
            sessionStorage.clear();
            window.location.href = "/frontend/Userhandling/login.html";
        }
    });

    function loadProducts() {
        $.ajax({
            url: 'http://localhost:4000/api/v1/home',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: data => {
                allProducts = data.products || [];
                applyFilters(); // Apply filters after loading products
            },
            error: () => {
                alert('Failed to load products');
                console.error('Failed to load products');
            }
        });
    }

    function applyFilters() {
        let products = [...allProducts];

        // Get current filter values
        const search = $('#searchInput').val().toLowerCase().trim();
        const category = $('#categoryFilter').val();
        const usage = $('#usageTypeFilter').val();
        const color = $('#colorFilter').val();
        const priceSort = $('#priceSort').val();
        const stockSort = $('#stockSort').val();

        // Apply text search filter
        if (search) {
            products = products.filter(product => 
                product.name.toLowerCase().includes(search) ||
                product.category.toLowerCase().includes(search) ||
                product.usage_type.toLowerCase().includes(search) ||
                (product.color && product.color.toLowerCase().includes(search))
            );
        }

        // Apply category filter
        if (category) {
            products = products.filter(product => 
                product.category === category
            );
        }

        // Apply usage type filter
        if (usage) {
            products = products.filter(product => 
                product.usage_type === usage
            );
        }

        // Apply color filter
        if (color) {
            products = products.filter(product => 
                product.color && product.color.toLowerCase().includes(color.toLowerCase())
            );
        }

        // Apply price sorting
        if (priceSort) {
            products.sort((a, b) => {
                const priceA = parseFloat(a.price) || 0;
                const priceB = parseFloat(b.price) || 0;
                return priceSort === 'asc' ? priceA - priceB : priceB - priceA;
            });
        }

        // Apply stock sorting
        if (stockSort) {
            products.sort((a, b) => {
                const stockA = parseInt(a.stock) || 0;
                const stockB = parseInt(b.stock) || 0;
                return stockSort === 'high' ? stockB - stockA : stockA - stockB;
            });
        }

        // Reset infinite scroll variables
        filteredProducts = products;
        displayedProducts = [];
        currentPage = 0;
        
        // Clear existing products and load first batch
        $('#productContainer').empty();
        loadNextBatch();
    }

    function loadNextBatch() {
        if (isLoading) return;
        
        isLoading = true;
        showLoadingIndicator();

        const startIndex = currentPage * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const nextBatch = filteredProducts.slice(startIndex, endIndex);

        if (nextBatch.length === 0) {
            hideLoadingIndicator();
            isLoading = false;
            return;
        }

        // Simulate network delay for better UX (remove in production if not needed)
        setTimeout(() => {
            displayedProducts.push(...nextBatch);
            renderNewProducts(nextBatch);
            currentPage++;
            isLoading = false;
            hideLoadingIndicator();
        }, 300);
    }

    function renderNewProducts(products) {
        let cards = '';
        
        products.forEach(product => {
            const imgTag = product.image
                ? `<img src="/frontend/images/${product.image.split(',')[0]}" alt="${product.name}" onerror="this.style.display='none'">`
                : '<div style="height: 160px; background: #f8bbd0; display: flex; align-items: center; justify-content: center; border-radius: 15px; color: #880e4f;">No Image</div>';

            const stock = parseInt(product.stock) || 0;
            const isOutOfStock = stock === 0;
            const color = product.color || 'Not specified';

            cards += `
                <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" data-product-id="${product.id}">
                    ${imgTag}
                    <h4>${product.name}</h4>
                    <p style="color: #666; font-style: italic; margin: 5px 0;">${color}</p>
                    <p><strong>Category:</strong> ${product.category}</p>
                    <p><strong>Usage:</strong> ${product.usage_type}</p>
                    <p><strong>Price:</strong> ₱${parseFloat(product.price).toFixed(2)}</p>
                    <p><strong>Stock:</strong> ${stock} ${stock === 1 ? 'item' : 'items'}</p>
                    ${isOutOfStock ? 
                        '<p style="color: #ff4444; font-weight: bold;">Out of Stock</p>' : 
                        `<button class="addToCartBtn" data-id="${product.id}">Add to Cart</button>
                         <button class="checkoutBtn" data-id="${product.id}">Checkout</button>`
                    }
                    <button class="checkReviewsBtn" data-id="${product.id}">Check Reviews</button>
                    <div class="reviews-container" id="reviews-${product.id}" style="display: none;"></div>
                </div>`;
        });

        // Show "no products found" message if this is the first load and no products
        if (displayedProducts.length === 0 && products.length === 0) {
            cards = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #880e4f;">
                    <h3>🌸 No products found</h3>
                    <p>Try adjusting your filters or search terms.</p>
                </div>
            `;
        }

        $('#productContainer').append(cards);
        
        // Reattach event listeners for new products
        $('.addToCartBtn').off('click').on('click', addToCart);
        $('.checkoutBtn').off('click').on('click', checkoutSolo);
        $('.checkReviewsBtn').off('click').on('click', checkReviews);
    }

    function showLoadingIndicator() {
        // Remove existing loading indicator
        $('#loadingIndicator').remove();
        
        // Add loading indicator
        const loadingHtml = `
            <div id="loadingIndicator" style="grid-column: 1 / -1; text-align: center; padding: 20px; color: #880e4f;">
                <div style="display: inline-block; animation: spin 1s linear infinite; border: 3px solid #f3f3f3; border-top: 3px solid #880e4f; border-radius: 50%; width: 30px; height: 30px;"></div>
                <p style="margin-top: 10px;">Loading more products...</p>
            </div>
        `;
        $('#productContainer').append(loadingHtml);
        
        // Add CSS animation if not exists
        if (!$('#spinAnimation').length) {
            $('head').append(`
                <style id="spinAnimation">
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `);
        }
    }

    function hideLoadingIndicator() {
        $('#loadingIndicator').remove();
    }

    // Infinite scroll implementation
    function initInfiniteScroll() {
        $(window).on('scroll', function() {
            // Check if user scrolled near bottom of page
            const scrollTop = $(window).scrollTop();
            const windowHeight = $(window).height();
            const documentHeight = $(document).height();
            
            // Trigger load when user is 200px from bottom
            if (scrollTop + windowHeight >= documentHeight - 200) {
                // Check if there are more products to load
                if (displayedProducts.length < filteredProducts.length && !isLoading) {
                    loadNextBatch();
                }
            }
        });
    }

    // Initialize infinite scroll
    initInfiniteScroll();

    function addToCart() {
        const productId = $(this).data('id');
        const button = $(this);
        
        // Disable button during request
        button.prop('disabled', true).text('Adding...');
        
        $.ajax({
            url: 'http://localhost:4000/api/v1/cart',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            contentType: 'application/json',
            data: JSON.stringify({ productId, quantity: 1 }),
            success: () => {
                alert('Added to cart!');
                loadCartCount(); // Update cart count
                button.prop('disabled', false).text('Add to Cart');
            },
            error: (xhr) => {
                const errorMsg = xhr.responseJSON?.message || 'Failed to add to cart';
                alert(errorMsg);
                button.prop('disabled', false).text('Add to Cart');
            }
        });
    }

    function checkoutSolo() {
        const productId = $(this).data('id');
        const button = $(this);
        
        // Disable button during request
        button.prop('disabled', true).text('Processing...');
        
        $.ajax({
            url: 'http://localhost:4000/api/v1/checkout/prepare-solo',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            contentType: 'application/json',
            data: JSON.stringify({ productId }),
            success: res => {
                // Store checkout data for checkout.html page
                sessionStorage.setItem('checkoutData', JSON.stringify(res.checkout));
                window.location.href = "/frontend/Userhandling/checkout.html";
            },
            error: err => {
                const errorMsg = err.responseJSON?.message || 'Checkout failed';
                alert(errorMsg);
                button.prop('disabled', false).text('Checkout');
            }
        });
    }

    // NEW FUNCTION: Check Reviews
    function checkReviews() {
        const productId = $(this).data('id');
        const button = $(this);
        const reviewsContainer = $(`#reviews-${productId}`);
        
        // Toggle reviews visibility
        if (reviewsContainer.is(':visible')) {
            reviewsContainer.slideUp();
            button.text('Check Reviews');
            return;
        }
        
        // Show loading state
        button.prop('disabled', true).text('Loading Reviews...');
        
        $.ajax({
            url: `http://localhost:4000/api/v1/reviews/${productId}`,
            method: 'GET',
            success: (data) => {
                const reviews = data.reviews || [];
                displayReviews(productId, reviews);
                reviewsContainer.slideDown();
                button.prop('disabled', false).text('Hide Reviews');
            },
            error: () => {
                alert('Failed to load reviews');
                button.prop('disabled', false).text('Check Reviews');
            }
        });
    }

    // NEW FUNCTION: Display Reviews
    function displayReviews(productId, reviews) {
        const reviewsContainer = $(`#reviews-${productId}`);
        
        if (reviews.length === 0) {
            reviewsContainer.html(`
                <h4 style="color: #880e4f; margin-bottom: 15px;">Customer Reviews</h4>
                <p style="color: #666; text-align: center; padding: 20px;">No reviews yet for this product.</p>
            `);
            return;
        }
        
        // Calculate average rating
        const totalRating = reviews.reduce((sum, review) => sum + parseInt(review.rating), 0);
        const averageRating = (totalRating / reviews.length).toFixed(1);
        
        let reviewsHtml = `
            <h4 style="color: #880e4f; margin-bottom: 10px;">Customer Reviews</h4>
            <div style="margin-bottom: 15px; padding: 10px; background: rgba(236, 64, 122, 0.1); border-radius: 8px;">
                <span style="color: #880e4f; font-weight: 600;">Average Rating: ${averageRating}/5</span>
                <span style="color: #ffc107; margin-left: 10px;">${generateStars(averageRating)}</span>
                <span style="color: #666; margin-left: 10px;">(${reviews.length} review${reviews.length > 1 ? 's' : ''})</span>
            </div>
            <div class="reviews-list">
        `;
        
        reviews.forEach(review => {
            const reviewDate = new Date(review.created_at).toLocaleDateString();
            reviewsHtml += `
                <div class="review-item">
                    <div class="review-header">
                        <div class="review-stars">${generateStars(review.rating)}</div>
                        <div class="review-rating">${review.rating}/5</div>
                    </div>
                    <div class="review-comment">"${review.comment}"</div>
                    <div class="review-meta">
                        <span class="review-author">By: ${review.user_name}</span>
                        <span class="review-date">${reviewDate}</span>
                    </div>
                </div>
            `;
        });
        
        reviewsHtml += '</div>';
        reviewsContainer.html(reviewsHtml);
    }

    // NEW FUNCTION: Generate Star Rating Display
    function generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '★';
        }
        
        // Add half star if needed
        if (hasHalfStar) {
            stars += '☆';
        }
        
        // Add empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '☆';
        }
        
        return stars;
    }

    function loadCartCount() {
        $.ajax({
            url: 'http://localhost:4000/api/v1/cart/count',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: (data) => {
                updateCartCount(data.count || 0);
            },
            error: () => {
                updateCartCount(0);
            }
        });
    }

    // Auto-apply filters when any filter input changes
    $('#searchInput').on('input', function() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            applyFilters();
        }, 300); // Debounce search for 300ms
    });

    $('#categoryFilter, #usageTypeFilter, #colorFilter, #priceSort, #stockSort').on('change', function() {
        applyFilters();
    });

    // Clear all filters
    function clearFilters() {
        $('#searchInput').val('');
        $('#categoryFilter').val('');
        $('#usageTypeFilter').val('');
        $('#colorFilter').val('');
        $('#priceSort').val('');
        $('#stockSort').val('');
        applyFilters();
    }

    // Add clear filters button functionality
    $('#clearFiltersBtn').on('click', clearFilters);

    // Navigation event handlers for dropdown menu
    $("#logoutBtn").click(() => {
        sessionStorage.clear();
        window.location.href = "/frontend/Userhandling/login.html";
    });

    $("#viewCartBtn").click(() => {
        window.location.href = "/frontend/Userhandling/cart.html";
    });

    $("#editProfileBtn").click(() => {
        window.location.href = "/frontend/Userhandling/profile.html";
    });

    // New Order History button handler
    $("#orderHistoryBtn").click(() => {
        window.location.href = "/frontend/Userhandling/review.html";
    });

    // Dropdown toggle functionality
    $("#userDropdownToggle").click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $("#userDropdownMenu").toggle();
    });

    // Close dropdown when clicking outside
    $(document).click(function(e) {
        if (!$(e.target).closest('#userDropdownToggle, #userDropdownMenu').length) {
            $("#userDropdownMenu").hide();
        }
    });

    // Prevent dropdown from closing when clicking inside it
    $("#userDropdownMenu").click(function(e) {
        e.stopPropagation();
    });

    // Remove periodic refresh to prevent interference with infinite scroll
    // Refresh products periodically only if user is idle
    let idleTimer;
    function resetIdleTimer() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            if (document.visibilityState === 'visible') {
                loadProducts();
            }
        }, 60000); // Refresh after 1 minute of inactivity
    }

    // Reset idle timer on user activity
    $(document).on('mousemove scroll keypress', resetIdleTimer);
    resetIdleTimer();
});

// Global functions that can be called from HTML
function updateCustomerName(customerName) {
    if (customerName) {
        $("#welcomeText").text(`Welcome, ${customerName}!`);
        // Also update the user avatar with first letter
        const firstLetter = customerName.charAt(0).toUpperCase();
        $(".user-avatar").text(firstLetter);
    }
}

function updateCartCount(count) {
    $("#cartCount").text(count || 0);
    // Optional: Hide cart count if zero
    if (count > 0) {
        $("#cartCount").show();
    } else {
        $("#cartCount").hide();
    }
}