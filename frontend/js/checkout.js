$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    const checkoutData = sessionStorage.getItem('checkoutData');

    if (!token || !checkoutData) {
        alert("No checkout data found. Please checkout first.");
        return window.location.href = "/frontend/Userhandling/home.html";
    }

    // Parse checkout data
    let checkout;
    try {
        checkout = JSON.parse(checkoutData);
    } catch (error) {
        alert("Invalid checkout data. Please try again.");
        return window.location.href = "/frontend/Userhandling/home.html";
    }

    // Validate checkout data structure
    if (!checkout || !checkout.items || !checkout.items.length) {
        alert('No checkout items found.');
        return window.location.href = "/frontend/Userhandling/home.html";
    }

    // Load and display checkout details immediately from sessionStorage
    displayCheckoutDetails(checkout);

    function displayCheckoutDetails(checkoutData) {
        // ✅ Show user address immediately
        if (checkoutData.userAddress) {
            $('#userAddress').text(checkoutData.userAddress);
        } else {
            $('#userAddress').text('Address not found');
        }

        let rows = '';
        let total = 0;
        
        checkoutData.items.forEach((item, index) => {
            const itemTotal = Number(item.price) * item.quantity;
            total += itemTotal;
            
            const image = item.image 
                ? `<img src="/frontend/images/${item.image.split(',')[0]}" width="50" height="50" />`
                : '<div style="width:50px;height:50px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:10px;">No Image</div>';
                
            rows += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₱${Number(item.price).toFixed(2)}</td>
                    <td>₱${itemTotal.toFixed(2)}</td>
                    <td>${image}</td>
                </tr>
            `;
        });

        $('#checkoutTable tbody').html(rows);
        $('#totalAmount').text(`₱${total.toFixed(2)}`);

        // Store the calculated total back to checkout data for final processing
        checkout.total = total;
        sessionStorage.setItem('checkoutData', JSON.stringify(checkout));
    }

    // Confirm checkout - now uses FinalCheckoutController
    $('#confirmCheckoutBtn').on('click', function () {
    const button = $(this);
    
    // Disable button during processing
    button.prop('disabled', true).text('Processing...');
    
    $.ajax({
        url: 'http://localhost:4000/api/v1/checkout/process-final',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        contentType: 'application/json',
        data: JSON.stringify({ 
            checkoutData: checkout
        }),
        success: function (res) {
            alert(res.message);
            // Clear checkout data after successful order
            sessionStorage.removeItem('checkoutData');
            window.location.href = "/frontend/Userhandling/home.html";
        },
        error: function (err) {
            console.error('Failed to confirm checkout:', err);
            alert(err.responseJSON?.message || 'Could not confirm order.');
            // Re-enable button on error
            button.prop('disabled', false).text('Confirm Order');
        }
    });
});

    // Cancel
    $('#cancelCheckoutBtn').on('click', function () {
        sessionStorage.removeItem('checkoutData');
        window.location.href = "/frontend/Userhandling/home.html";
    });
});