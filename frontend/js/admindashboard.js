$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');

    if (!token || !userId) {
        return window.location.href = "/frontend/Userhandling/login.html";
    }

    $.ajax({
        method: "GET",
        url: `http://localhost:4000/api/v1/profile/${userId}`,
        headers: {
            'Authorization': `Bearer ${token}`
        },
        success: function (res) {
            if (res.user.role !== 'admin') {
                sessionStorage.clear();
                return window.location.href = "/frontend/Userhandling/home.html";
            }

            $("#adminName").text(res.user.name);
        },
        error: function () {
            sessionStorage.clear();
            window.location.href = "/frontend/Userhandling/login.html";
        }
    });
});

$.ajax({
    method: "GET",
    url: "http://localhost:4000/api/v1/admindashboard",
    headers: { 'Authorization': `Bearer ${token}` },
    success: function (res) {
        const stats = res.stats;
        $("#statUsers").text(stats.customers);
        $("#statProducts").text(stats.products);
        $("#statOrders").text(stats.orders);
        $("#statReviews").text(stats.reviews);
    },
    error: function () {
        Swal.fire("Error", "Failed to load dashboard stats", "error");
    }
});
