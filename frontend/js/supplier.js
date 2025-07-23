$(document).ready(function () {
    const apiUrl = 'http://localhost:4000/api/v1/supplier';
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');

    if (!token || !userId) {
        return window.location.href = "/frontend/Userhandling/login.html";
    }

    // ✅ Verify if user is really admin
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

            // ✅ User is admin → load suppliers
            loadSuppliers();
        },
        error: function () {
            sessionStorage.clear();
            window.location.href = "/frontend/Userhandling/login.html";
        }
    });

    function loadSuppliers() {
        $.ajax({
            url: apiUrl,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (data) {
                let rows = '';
                data.forEach((supplier, index) => {
                    rows += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${supplier.supplier_name}</td>
                            <td>${supplier.email}</td>
                            <td>${supplier.phone || ''}</td>
                            <td>${supplier.address || ''}</td>
                            <td>
                                <button class="editBtn" data-id="${supplier.id}">Edit</button>
                                <button class="deleteBtn" data-id="${supplier.id}">Delete</button>
                            </td>
                        </tr>`;
                });
                $('#supplierTable tbody').html(rows);
            },
            error: function () {
                alert('Failed to load suppliers');
            }
        });
    }

    $('#supplierForm').on('submit', function (e) {
        e.preventDefault();

        const id = $('#supplierId').val();
        const supplier = {
            supplier_name: $('#supplier_name').val(),
            email: $('#email').val(),
            phone: $('#phone').val(),
            address: $('#address').val()
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiUrl}/${id}` : apiUrl;

        $.ajax({
            url,
            method,
            contentType: 'application/json',
            data: JSON.stringify(supplier),
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: () => {
                alert(id ? "Updated!" : "Added!");
                $('#supplierForm')[0].reset();
                $('#submitBtn').text("Add Supplier");
                $('#supplierId').val('');
                loadSuppliers();
            },
            error: err => alert(err.responseJSON?.error || "Error occurred.")
        });
    });

    $(document).on('click', '.editBtn', function () {
        const id = $(this).data('id');
        $.ajax({
            url: `${apiUrl}/${id}`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (supplier) {
                $('#supplierId').val(supplier.id);
                $('#supplier_name').val(supplier.supplier_name);
                $('#email').val(supplier.email);
                $('#phone').val(supplier.phone);
                $('#address').val(supplier.address);
                $('#submitBtn').text("Update Supplier");
            },
            error: function () {
                alert('Failed to load supplier details');
            }
        });
    });

    $(document).on('click', '.deleteBtn', function () {
        const id = $(this).data('id');
        if (confirm('Are you sure you want to delete this supplier?')) {
            $.ajax({
                url: `${apiUrl}/${id}`,
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                success: () => {
                    alert("Deleted!");
                    loadSuppliers();
                },
                error: function () {
                    alert('Failed to delete supplier');
                }
            });
        }
    });
});
