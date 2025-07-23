$(document).ready(function() {
    const token = sessionStorage.getItem('token');
    if (!token) return window.location.href = "/frontend/Userhandling/login.html";

    let editProductId = null;

    // Load ordered products into dropdown
    $.ajax({
        url: 'http://localhost:4000/api/v1/home',
        method: 'GET',
        success: function(res) {
            let options = res.products.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
            $('#productId').html(options);
        }
    });

    function loadMyReview(productId) {
        $.ajax({
            url: `http://localhost:4000/api/v1/review/${productId}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function(res) {
                if (res.review) {
                    $('#rating').val(res.review.rating);
                    $('#comment').val(res.review.comment);
                    editProductId = productId;
                } else {
                    $('#rating').val('');
                    $('#comment').val('');
                    editProductId = null;
                }
            }
        });
    }

    $('#productId').on('change', function() {
        const productId = $(this).val();
        loadMyReview(productId);
    });

    $('#saveReviewBtn').on('click', function() {
        const productId = $('#productId').val();
        const rating = $('#rating').val();
        const comment = $('#comment').val();

        $.ajax({
            url: 'http://localhost:4000/api/v1/review',
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            contentType: 'application/json',
            data: JSON.stringify({ productId: Number(productId), rating: Number(rating), comment }),
            success: () => {
                alert('Review saved!');
                loadMyReview(productId);
            },
            error: (err) => {
                console.error('Failed to save review:', err);
                alert(err.responseJSON?.message || 'Failed to save review');
            }
        });
    });

    $('#deleteReviewBtn').on('click', function() {
        const productId = $('#productId').val();
        $.ajax({
            url: `http://localhost:4000/api/v1/review/${productId}`,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
            success: () => {
                alert('Deleted!');
                $('#rating').val('');
                $('#comment').val('');
            },
            error: () => alert('Failed to delete review')
        });
    });
});
