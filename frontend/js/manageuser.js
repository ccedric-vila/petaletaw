$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const apiUrl = 'http://localhost:4000/api/v1/users';

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

            loadUsers();
        },
        error: function () {
            sessionStorage.clear();
            window.location.href = "/frontend/Userhandling/login.html";
        }
    });

    function loadUsers() {
        $.ajax({
            url: apiUrl,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (data) {
                let rows = '';
                data.forEach((u, index) => {
                    rows += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${u.name}</td>
                            <td>${u.email}</td>
                            <td>${u.contact_number || ''}</td>
                            <td>${u.address || ''}</td>
                            <td>${u.role}</td>
                            <td>${u.status}</td>
                            <td>
                                <button class="editBtn" data-id="${u.id}">Edit</button>
                            </td>
                        </tr>`;
                });
                $('#userTable tbody').html(rows);
            },
            error: function () {
                alert('Failed to load users');
            }
        });
    }

    $('#userForm').on('submit', function (e) {
        e.preventDefault();

        const id = $('#userId').val();
        const user = {
            role: $('#role').val(),
            status: $('#status').val()
        };

        $.ajax({
            url: `${apiUrl}/${id}`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(user),
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: () => {
                alert('Role and status updated!');
                $('#userForm')[0].reset();
                $('#submitBtn').text('Update');
                $('#userId').val('');
                $('#editingUserName').text(''); // ✅ Clear name after update
                loadUsers();
            },
            error: err => alert(err.responseJSON?.error || 'Error occurred.')
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
            success: function (u) {
                $('#userId').val(u.id);
                $('#role').val(u.role);
                $('#status').val(u.status);
                $('#submitBtn').text('Update');

                // ✅ Show user name on top of form
                $('#editingUserName').text(`Editing: ${u.name}`);
                
                // ✅ ADD THIS LINE TO SHOW THE FORM
                $('#formContainer').show();
            },
            error: function () {
                alert('Failed to load user details');
            }
        });
    });
});
