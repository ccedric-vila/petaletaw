$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');

    if (!token || !userId) {
        return window.location.href = "/frontend/Userhandling/login.html";
    }

    // ✅ Verify admin
    $.ajax({
        method: "GET",
        url: `http://localhost:4000/api/v1/profile/${userId}`,
        headers: { 'Authorization': `Bearer ${token}` },
        success: function (res) {
            if (!res.user || res.user.role !== 'admin') {
                alert('Access denied: admin only');
                sessionStorage.clear();
                return window.location.href = "/frontend/Userhandling/login.html";
            }

            // ✅ If admin, load orders
            loadOrders();
        },
        error: function (err) {
            console.error('Failed to verify admin', err);
            sessionStorage.clear();
            window.location.href = "/frontend/Userhandling/login.html";
        }
    });

    function loadOrders() {
        $.ajax({
            url: 'http://localhost:4000/api/v1/orders',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (orders) {
                let rows = '';

                orders.forEach((order, index) => {
                    // Generate action buttons based on status
                    let actionButtons = getActionButtons(order.status, order.id);

                    rows += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${order.id}</td>
                            <td>${order.customer_name || 'N/A'}</td>
                            <td>${order.status}</td>
                            <td>${order.shipping_address || '-'}</td>
                            <td>₱${order.total_amount || 0}</td>
                            <td>
                                ${actionButtons}
                            </td>
                        </tr>`;
                });
                $('#orderTable tbody').html(rows);
            },
            error: function (err) {
                console.error('Failed to load orders', err);
                alert('Could not load orders');
            }
        });
    }

    // Generate action buttons based on order status
    function getActionButtons(status, orderId) {
        switch (status) {
            case 'Pending':
                return `
                    <button class="btn-confirm" data-id="${orderId}" data-action="Confirmed">Confirm</button>
                    <button class="btn-cancel" data-id="${orderId}" data-action="Cancelled">Cancel</button>
                `;
            case 'Confirmed':
                return `
                    <button class="btn-delivery" data-id="${orderId}" data-action="Out for Delivery">Out for Delivery</button>
                `;
            case 'Out for Delivery':
                return `
                    <button class="btn-delivered" data-id="${orderId}" data-action="Delivered">Delivered</button>
                `;
            case 'Delivered':
                return `<span class="status-completed">Completed</span>`;
            case 'Cancelled':
                return `<span class="status-cancelled">Cancelled</span>`;
            default:
                return '-';
        }
    }

    // Handle action button clicks
    $(document).on('click', '.btn-confirm, .btn-cancel, .btn-delivery, .btn-delivered', function () {
        const orderId = $(this).data('id');
        const action = $(this).data('action');
        const buttonText = $(this).text();

        // Confirm action
        if (confirm(`Are you sure you want to ${buttonText.toLowerCase()} this order?`)) {
            updateOrderStatus(orderId, action, buttonText);
        }
    });

    // Update order status
    function updateOrderStatus(orderId, status, actionName) {
        $.ajax({
            url: `http://localhost:4000/api/v1/orders/${orderId}/status`,
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            contentType: 'application/json',
            data: JSON.stringify({ status }),
            success: function () {
                alert(`Order ${actionName.toLowerCase()}ed successfully!`);
                loadOrders(); // Reload the table
            },
            error: function (err) {
                console.error(`Failed to ${actionName.toLowerCase()} order:`, err);
                alert(`Failed to ${actionName.toLowerCase()} order`);
            }
        });
    }
});