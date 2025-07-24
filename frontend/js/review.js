$(document).ready(function() {
    const token = sessionStorage.getItem('token');
    if (!token) return window.location.href = "/frontend/Userhandling/login.html";

    let editOrderId = null; // Changed from editOrderItemId to editOrderId

    // Load order history
    function loadOrderHistory() {
        // Show loading indicator
        $('#loadingIndicator').show();
        
        $.ajax({
            url: 'http://localhost:4000/api/v1/orders/history',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function(res) {
                console.log('Order history loaded:', res); // Debug log
                $('#loadingIndicator').hide();
                
                if (res.orders && res.orders.length > 0) {
                    displayOrderHistory(res.orders);
                } else {
                    $('#orderHistoryContainer').html('<div class="alert alert-info">No order history found.</div>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load order history:', xhr.responseJSON || error);
                $('#loadingIndicator').hide();
                $('#orderHistoryContainer').html(
                    `<div class="alert alert-danger">
                        Failed to load order history: ${xhr.responseJSON?.message || error}
                        <br><small>Status: ${xhr.status}</small>
                    </div>`
                );
            }
        });
    }

    // Display order history in the page
    function displayOrderHistory(orders) {
        const historyHtml = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>Order</h3>
                        <p class="mb-1">Order Date: ${new Date(order.order_date).toLocaleDateString()}</p>
                        <p class="mb-1">Total: ₱${parseFloat(order.total_amount).toFixed(2)}</p>
                    </div>
                    <div>
                        <span class="badge bg-${getStatusColor(order.status)}">${order.status}</span>
                        ${getReviewButton(order)}
                    </div>
                </div>
                <div class="order-items">
                    <h5>Products:</h5>
                    <div class="row">
                        ${order.items.map(item => `
                            <div class="col-12 order-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${item.product_name}</strong><br>
                                        <small>Qty: ${item.quantity} × ₱${parseFloat(item.price).toFixed(2)}</small>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${order.review ? `
                    <div class="order-review mt-3">
                        <h6><i class="fas fa-star text-warning"></i> Your Review:</h6>
                        <div class="review-display">
                            <span class="review-rating">★ ${order.review.rating}/5</span>
                            <p class="review-comment mt-1">${order.review.comment || 'No comment provided'}</p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('');

        $('#orderHistoryContainer').html(historyHtml);

        // Add click handler for review buttons
        $('.btn-review').on('click', function() {
            const orderId = $(this).data('order-id');
            console.log('Opening review modal for order:', orderId); // Debug log
            editOrderId = orderId;
            $('#reviewModal').modal('show');
            loadMyReview(orderId);
        });

        // Add click handler for update review buttons
        $('.btn-update-review').on('click', function() {
            const orderId = $(this).data('order-id');
            console.log('Opening update review modal for order:', orderId); // Debug log
            editOrderId = orderId;
            $('#reviewModal').modal('show');
            loadMyReview(orderId);
        });
    }

    // Helper function to get review button based on order status and review existence
    function getReviewButton(order) {
        if (order.status === 'Delivered') {
            if (order.review) {
                return `<button class="btn btn-sm btn-update-review ms-2" data-order-id="${order.order_id}">Update Review</button>`;
            } else {
                return `<button class="btn btn-sm btn-review ms-2" data-order-id="${order.order_id}">Review</button>`;
            }
        }
        return ''; // No button for non-delivered orders
    }

    // Helper function for status colors
    function getStatusColor(status) {
        switch(status.toLowerCase()) {
            case 'delivered': return 'success';
            case 'pending': return 'warning';
            case 'cancelled': return 'danger';
            default: return 'secondary';
        }
    }

    // Load review for a specific order (changed from order item to order)
    function loadMyReview(orderId) {
        console.log('Loading review for order:', orderId); // Debug log
        
        $.ajax({
            url: `http://localhost:4000/api/v1/reviews/item/${orderId}`, // Keep same URL to avoid route changes
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function(res) {
                console.log('Review data:', res); // Debug log
                if (res.review) {
                    $('#rating').val(res.review.rating);
                    $('#comment').val(res.review.comment);
                    $('#deleteReviewBtn').removeClass('d-none'); // Show delete button
                    editOrderId = orderId;
                } else {
                    $('#rating').val(5); // Default rating
                    $('#comment').val('');
                    $('#deleteReviewBtn').addClass('d-none'); // Hide delete button
                    editOrderId = orderId;
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load review:', xhr.responseJSON || error);
                $('#rating').val(5);
                $('#comment').val('');
                $('#deleteReviewBtn').addClass('d-none');
            }
        });
    }

    // Save review button click handler
    $('#saveReviewBtn').on('click', function() {
        const orderId = editOrderId;
        const rating = $('#rating').val();
        const comment = $('#comment').val();

        console.log('Saving review:', { orderId, rating, comment }); // Debug log

        $.ajax({
            url: 'http://localhost:4000/api/v1/reviews',
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({ 
                order_item_id: Number(orderId), // Keep same field name to avoid backend changes
                rating: Number(rating), 
                comment 
            }),
            success: function(res) {
                console.log('Review saved:', res); // Debug log
                alert('Review saved successfully!');
                $('#reviewModal').modal('hide');
                loadOrderHistory(); // Refresh history to show updated review
            },
            error: function(xhr, status, error) {
                console.error('Failed to save review:', xhr.responseJSON || error);
                alert(xhr.responseJSON?.message || 'Failed to save review');
            }
        });
    });

    // Delete review button click handler
    $('#deleteReviewBtn').on('click', function() {
        if (!confirm('Are you sure you want to delete this review?')) return;
        
        const orderId = editOrderId;
        
        $.ajax({
            url: `http://localhost:4000/api/v1/reviews/${orderId}`, // Keep same URL pattern
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function(res) {
                console.log('Review deleted:', res); // Debug log
                alert('Review deleted successfully!');
                $('#reviewModal').modal('hide');
                loadOrderHistory(); // Refresh history
            },
            error: function(xhr, status, error) {
                console.error('Failed to delete review:', xhr.responseJSON || error);
                alert(xhr.responseJSON?.message || 'Failed to delete review');
            }
        });
    });

    // Back to Home handler
    $('#backToHomeBtn').on('click', function() {
        window.location.href = "/frontend/Userhandling/home.html";
    });

    // Initial load
    loadOrderHistory();
});