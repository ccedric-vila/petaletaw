$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    if (!token) {
        alert("You must login first.");
        return window.location.href = "/frontend/Userhandling/login.html";
    }

    function loadCart() {
        $.ajax({
            url: 'http://localhost:4000/api/v1/cart',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (res) {
                const cart = res.cart;
                if (!cart.length) {
                    alert("Your cart is empty.");
                    return window.location.href = "/frontend/Userhandling/home.html";
                }

                let rows = '';
                let total = 0;

                cart.forEach((item, index) => {
                    total += Number(item.price) * item.quantity;

                    const images = item.image ? item.image.split(',') : [];
                    const imageHtml = images.length > 0 ? `
                        <div class="image-slider" data-index="0" data-images='${JSON.stringify(images)}'>
                            ${images.length > 1 ? `<button class="img-nav-btn left">&lt;</button>` : ''}
                            <img class="cart-img" src="/frontend/images/${images[0]}" />
                            ${images.length > 1 ? `<button class="img-nav-btn right">&gt;</button>` : ''}
                        </div>
                    ` : '';

                    rows += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${item.name}</td>
                            <td>${imageHtml}</td>
                            <td>₱${item.price}</td>
                            <td>${item.quantity}</td>
                            <td>
                                <button class="incrementBtn" data-id="${item.cart_item_id}">+</button>
                                <button class="decrementBtn" data-id="${item.cart_item_id}">-</button>
                                <button class="removeBtn" data-id="${item.cart_item_id}">Remove</button>
                            </td>
                        </tr>
                    `;
                });

                $('#cartTable tbody').html(rows);
                $('#cartTotal').text(`₱${total.toFixed(2)}`);
            },
            error: function (err) {
                console.error('Failed to load cart:', err);
                alert(err.responseJSON?.message || 'Could not load cart.');
                window.location.href = "/frontend/Userhandling/home.html";
            }
        });
    }

    loadCart();

    $(document).on('click', '.incrementBtn', function () {
        const cartItemId = $(this).data('id');
        $.ajax({
            url: `http://localhost:4000/api/v1/cart/${cartItemId}/increment`,
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            success: loadCart,
            error: function () {
                alert('Failed to increase quantity.');
            }
        });
    });

    $(document).on('click', '.decrementBtn', function () {
        const cartItemId = $(this).data('id');
        $.ajax({
            url: `http://localhost:4000/api/v1/cart/${cartItemId}/decrement`,
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            success: loadCart,
            error: function () {
                alert('Failed to decrease quantity.');
            }
        });
    });

    $(document).on('click', '.removeBtn', function () {
        const cartItemId = $(this).data('id');
        $.ajax({
            url: `http://localhost:4000/api/v1/cart/${cartItemId}`,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
            success: loadCart,
            error: function () {
                alert('Failed to remove item.');
            }
        });
    });

   // Replace the existing checkout button click handler with this updated version:

$('#checkoutBtn').on('click', function () {
    const button = $(this);
    
    // Disable button during processing
    button.prop('disabled', true).text('Processing...');
    
    $.ajax({
        url: 'http://localhost:4000/api/v1/checkout/prepare-cart',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        contentType: 'application/json',
        data: JSON.stringify({}), // Empty object - will checkout all cart items
        success: function (res) {
            // Store checkout data for checkout.html page
            sessionStorage.setItem('checkoutData', JSON.stringify(res.checkout));
            window.location.href = "/frontend/Userhandling/checkout.html";
        },
        error: function (err) {
            console.error('Failed to proceed to checkout:', err);
            const errorMsg = err.responseJSON?.message || 'Could not proceed to checkout.';
            alert(errorMsg);
            
            // Re-enable button on error
            button.prop('disabled', false).text('Checkout');
        }
    });
});

    $('#backToHomeBtn').on('click', function () {
        window.location.href = "/frontend/Userhandling/home.html";
    });

    // 👈 👉 Image navigation
    $(document).on('click', '.img-nav-btn', function () {
        const slider = $(this).closest('.image-slider');
        const images = JSON.parse(slider.attr('data-images'));
        let index = parseInt(slider.attr('data-index'));

        if ($(this).hasClass('left')) {
            index = (index - 1 + images.length) % images.length;
        } else {
            index = (index + 1) % images.length;
        }

        slider.attr('data-index', index);
        slider.find('img').attr('src', `/frontend/images/${images[index]}`);
    });
});