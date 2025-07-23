$(document).ready(function () {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    const productApi = 'http://localhost:4000/api/v1/product';
    const supplierApi = 'http://localhost:4000/api/v1/supplier';

    if (!token || !userId) {
        sessionStorage.clear();
        window.location.href = "/frontend/Userhandling/login.html";
        return;
    }

    // Auth check + data load
    $.ajax({
        method: "GET",
        url: `http://localhost:4000/api/v1/profile/${userId}`,
        headers: { 'Authorization': `Bearer ${token}` },
        success: function (res) {
            if (res.user.role !== 'admin') {
                sessionStorage.clear();
                window.location.href = "/frontend/Userhandling/home.html";
                return;
            }
            loadProducts();
            loadSuppliers();
        },
        error: function () {
            sessionStorage.clear();
            window.location.href = "/frontend/Userhandling/login.html";
        }
    });

    function loadSuppliers(selectedSupplierId = null) {
        $.ajax({
            url: supplierApi,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (data) {
                let options = '<option value="">-- Supplier (Optional) --</option>';
                data.forEach(supplier => {
                    const selected = supplier.id == selectedSupplierId ? 'selected' : '';
                    options += `<option value="${supplier.id}" ${selected}>${supplier.supplier_name}</option>`;
                });
                $('#supplier_id').html(options);
            },
            error: function () {
                alert('Failed to load suppliers');
            }
        });
    }

    function loadProducts() {
        $.ajax({
            url: productApi,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (data) {
                let rows = '';
                data.forEach((product, index) => {
                    let imageDisplay = '';
                    if (product.image) {
                        const imageArray = product.image.split(',');
                        const firstImage = imageArray[0];
                        imageDisplay = `
                          <div class="image-slider" data-index="0" data-images='${JSON.stringify(imageArray)}'>
                            <button class="slider-btn prev-btn">&lt;</button>
                            <img src="/frontend/images/${firstImage}" class="slider-img">
                            <button class="slider-btn next-btn">&gt;</button>
                          </div>`;
                    }

                    rows += `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${product.name}</td>
                            <td>${product.category}</td>
                            <td>${product.usage_type}</td>
                            <td>₱${product.price}</td>
                            <td>${product.stock}</td>
                            <td>${imageDisplay}</td>
                            <td>${product.supplier_name || ''}</td>
                            <td>
                                <button class="editBtn" data-id="${product.id}">Edit</button>
                                <button class="deleteBtn" data-id="${product.id}">Delete</button>
                            </td>
                        </tr>`;
                });
                $('#productTable tbody').html(rows);
            },
            error: function (err) {
                console.error('Error loading products:', err);
                alert('Failed to load products');
            }
        });
    }

    $('#productForm').submit(function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        const productId = $('#productId').val();
        const isEdit = !!productId;

        $.ajax({
            url: isEdit ? `${productApi}/${productId}` : productApi,
            method: isEdit ? 'PUT' : 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                alert(isEdit ? 'Product updated successfully!' : 'Product added successfully!');
                $('#productForm')[0].reset();
                $('#productId').val('');
                $('#submitBtn').text('Add Product');
                // Hide form and show add button after successful submission
                $('#formContainer').hide();
                $('#showFormBtn').show();
                loadProducts();
                loadSuppliers();
            },
            error: function (err) {
                console.error('Error:', err);
                let errorMsg = 'Operation failed. Please try again.';
                if (err.responseJSON && err.responseJSON.error) {
                    errorMsg = err.responseJSON.error;
                    if (err.responseJSON.details) {
                        errorMsg += ` (${err.responseJSON.details})`;
                    }
                }
                alert(errorMsg);
            }
        });
    });

    $(document).on('click', '.editBtn', function () {
        const productId = $(this).data('id');
        
        // SHOW FORM FIRST before doing anything else
        console.log('Showing form container...');
        $("#formContainer").show();
        $("#showFormBtn").hide();
        
        // Reset form first
        $("#productForm")[0].reset();
        $("#productId").val('');
        
        // Change button text immediately
        $('#submitBtn').text('Update Product');
        
        // Scroll to form immediately
        $('html, body').animate({ scrollTop: $('#productForm').offset().top }, 500);
        
        // Then populate with data
        $.ajax({
            url: `${productApi}/${productId}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (product) {
                console.log('Product data loaded:', product);
                $('#productId').val(product.id);
                $('#name').val(product.name);
                $('#category').val(product.category);
                $('#usage_type').val(product.usage_type);
                $('#description').val(product.description);
                $('#price').val(product.price);
                $('#color').val(product.color);
                $('#stock').val(product.stock);
                loadSuppliers(product.supplier_id);
            },
            error: function (err) {
                console.error('Error loading product:', err);
                alert('Failed to load product details');
                // Hide form if there's an error loading product data
                $("#formContainer").hide();
                $("#showFormBtn").show();
            }
        });
    });

    $(document).on('click', '.deleteBtn', function () {
        if (!confirm('Are you sure you want to delete this product?')) return;
        const productId = $(this).data('id');
        $.ajax({
            url: `${productApi}/${productId}`,
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function () {
                alert('Product deleted successfully');
                loadProducts();
            },
            error: function (err) {
                console.error('Error deleting product:', err);
                alert('Failed to delete product');
            }
        });
    });

    // Image slider navigation
    $(document).on('click', '.next-btn, .prev-btn', function () {
        const $slider = $(this).closest('.image-slider');
        const images = JSON.parse($slider.attr('data-images'));
        let index = parseInt($slider.attr('data-index'));

        if ($(this).hasClass('next-btn')) {
            index = (index + 1) % images.length;
        } else {
            index = (index - 1 + images.length) % images.length;
        }

        $slider.find('img').attr('src', `/frontend/images/${images[index]}`);
        $slider.attr('data-index', index);
    });
});