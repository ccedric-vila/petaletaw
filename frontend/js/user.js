$(document).ready(function () {
    const url = `http://localhost:4000/api/v1/register`;

    // 🔍 FETCH PROFILE DATA ON PAGE LOAD
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');

    if (token && userId) {
        // Fetch profile data and populate form
        $.ajax({
            method: "GET",
            url: `http://localhost:4000/api/v1/profile/${userId}`,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            success: function (data) {
                if (data.user) {
                    // Populate form fields with existing data
                    $('#fullName').val(data.user.name || '');
                    $('#phone').val(data.user.contact_number || '');
                    $('#address').val(data.user.address || '');
                    
                    // Handle profile image if exists
                    if (data.user.profile_image) {
                        $('#avatarPreview').attr('src', `http://localhost:4000/${data.user.profile_image}`).show();
                        $('.upload-placeholder').hide();
                        $('.avatar-upload-area').addClass('has-image');
                    }
                }
            },
            error: function () {
                sessionStorage.clear();
                window.location.href = "/frontend/Userhandling/login.html";
            }
        });
    }

    // 📌 REGISTER USER
    $("#register").on('click', function (e) {
        e.preventDefault();
        const name = $("#name").val().trim();
        const email = $("#email").val().trim();
        const password = $("#password").val().trim();

        if (!name || !email || !password) {
            return Swal.fire({
                icon: "warning",
                text: "All fields are required.",
                position: 'bottom-right'
            });
        }

        const user = { name, email, password };

        $.ajax({
            method: "POST",
            url: `http://localhost:4000/api/v1/register`,
            data: JSON.stringify(user),
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    icon: "success",
                    text: "Registration successful! Redirecting to login...",
                    position: 'bottom-right',
                    timer: 1500,
                    showConfirmButton: false
                });

                // Use setTimeout to redirect after toast finishes
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1600); // Delay slightly longer than the Swal timer
            },
            error: function (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    text: "Registration failed. Please try again.",
                    position: 'bottom-right'
                });
            }
        });
    });

    // 🖼 AVATAR PREVIEW
    $('#avatar').on('change', function () {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    // 🔐 LOGIN USER
// 🔐 LOGIN USER
$("#login").on('click', function (e) {
    e.preventDefault();
    const email = $("#email").val().trim();
    const password = $("#password").val().trim();

    if (!email || !password) {
        return Swal.fire({
            icon: "warning",
            text: "Email and password are required.",
            position: 'bottom-right'
        });
    }

    const user = { email, password };

    $.ajax({
        method: "POST",
        url: `http://localhost:4000/api/v1/login`,
        data: JSON.stringify(user),
        contentType: 'application/json; charset=utf-8',
        dataType: "json",
        success: function (data) {
            console.log(data);

            Swal.fire({
                text: data.success,
                position: 'bottom-right',
                timer: 1000,
                showConfirmButton: false,
                timerProgressBar: true
            });

            // Save token and user data
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('userId', data.user.id);
            sessionStorage.setItem('role', data.user.role); // 🟨 Save role

            // ✅ Redirect based on role
            if (data.user.role === 'admin') {
                window.location.href = '/frontend/AdminHandling/admindashboard.html';
            } else {
                window.location.href = '/frontend/UserHandling/home.html';
            }
        },
        error: function (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                text: error.responseJSON?.message || "Login failed",
                position: 'bottom-right',
                timer: 1500,
                showConfirmButton: false,
                timerProgressBar: true
            });
        }
    });
});


    // 📝 UPDATE PROFILE
    $("#updateBtn").on('click', function (e) {
        e.preventDefault();
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            return Swal.fire({
                icon: "error",
                text: "User not logged in.",
                position: 'bottom-right'
            });
        }

        const form = $('#profileForm')[0];
        const formData = new FormData(form);
        formData.append('userId', userId);

        $.ajax({
            method: "POST",
            url: `http://localhost:4000/api/v1/profile`,
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('token')}`
            },
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    icon: "success",
                    text: "Profile updated!",
                    position: 'bottom-right',
                    timer: 1500,
                    showConfirmButton: false
                });
            },
            error: function (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    text: "Profile update failed.",
                    position: 'bottom-right'
                });
            }
        });
    });
});