$(document).ready(function() {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');

    if (!token || !userId) {
        return window.location.href = "/frontend/Userhandling/login.html";
    }

    loadReviews();

    function loadReviews() {
        $.ajax({
            url: 'http://localhost:4000/api/v1/managereview',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: res => {
                let rows = '';
                res.reviews.forEach((r, idx) => {
                    rows += `
                        <tr>
                            <td>${idx+1}</td>
                            <td>${r.user_name} (ID: ${r.user_id})</td>
                            <td>${r.product_name} (ID: ${r.product_id})</td>
                            <td>${r.rating}</td>
                            <td>${r.comment}</td>
                            <td>${new Date(r.created_at).toLocaleString()}</td>
                            <td>
                                <button class="deleteBtn" data-id="${r.id}">Delete</button>
                            </td>
                        </tr>`;
                });
                $('#reviewTable tbody').html(rows);
            },
            error: err => {
                console.error('Failed to load reviews', err);
                alert('Failed to load reviews');
            }
        });
    }

    $(document).on('click', '.deleteBtn', function() {
        const id = $(this).data('id');
        if (!confirm('Are you sure you want to delete this review?')) return;

        $.ajax({
            url: `http://localhost:4000/api/v1/managereview/${id}`,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
            success: () => {
                alert('Deleted!');
                loadReviews();
            },
            error: () => alert('Failed to delete review')
        });
    });
});
