$(document).ready(function() {
    const token = sessionStorage.getItem('token');

    if (!token) return window.location.href = "/frontend/Userhandling/login.html";

    // Pie chart: Most sold products
    $.ajax({
        url: 'http://localhost:4000/api/v1/charts/most-sold-products',
        headers: { 'Authorization': `Bearer ${token}` },
        success: data => {
            const labels = data.map(d => d.name);
            const values = data.map(d => d.total_sold);
            new Chart(document.getElementById('pieChart'), {
                type: 'pie',
                data: { labels, datasets: [{ label: 'Most Sold Products', data: values }] },
            });
        },
        error: () => alert('Failed to load pie chart')
    });

    // Line chart: Orders by address
    $.ajax({
        url: 'http://localhost:4000/api/v1/charts/orders-by-address',
        headers: { 'Authorization': `Bearer ${token}` },
        success: data => {
            const labels = data.map(d => d.address);
            const values = data.map(d => d.total_orders);
            new Chart(document.getElementById('lineChart'), {
                type: 'line',
                data: { labels, datasets: [{ label: 'Orders by Address', data: values }] },
            });
        },
        error: () => alert('Failed to load line chart')
    });

    // Bar chart: Monthly sales
    $.ajax({
        url: 'http://localhost:4000/api/v1/charts/monthly-sales',
        headers: { 'Authorization': `Bearer ${token}` },
        success: data => {
            const labels = data.map(d => d.month);
            const values = data.map(d => d.total_sales);
            new Chart(document.getElementById('barChart'), {
                type: 'bar',
                data: { labels, datasets: [{ label: 'Monthly Sales', data: values }] },
            });
        },
        error: () => alert('Failed to load bar chart')
    });
});
