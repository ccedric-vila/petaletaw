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

    // jQuery Validation Setup
    $.validator.addMethod("currency", function(value, element) {
        return this.optional(element) || /^\d+(\.\d{1,2})?$/.test(value);
    }, "Please enter a valid price (e.g., 10.50)");

    $.validator.addMethod("positiveInteger", function(value, element) {
        return this.optional(element) || (Number.isInteger(Number(value)) && Number(value) >= 0);
    }, "Please enter a valid non-negative number");

    // Initialize form validation
    $("#productForm").validate({
        rules: {
            name: {
                required: true,
                minlength: 2,
                maxlength: 100
            },
            category: {
                required: true
            },
            usage_type: {
                required: true
            },
            description: {
                maxlength: 500
            },
            price: {
                required: true,
                currency: true,
                min: 0.01
            },
            color: {
                maxlength: 50
            },
            stock: {
                required: true,
                positiveInteger: true,
                min: 0
            }
        },
        messages: {
            name: {
                required: "Product name is required",
                minlength: "Product name must be at least 2 characters",
                maxlength: "Product name cannot exceed 100 characters"
            },
            category: {
                required: "Please select a category"
            },
            usage_type: {
                required: "Please select a usage type"
            },
            description: {
                maxlength: "Description cannot exceed 500 characters"
            },
            price: {
                required: "Price is required",
                min: "Price must be greater than 0"
            },
            color: {
                maxlength: "Color cannot exceed 50 characters"
            },
            stock: {
                required: "Stock quantity is required",
                min: "Stock cannot be negative"
            }
        },
        errorElement: 'div',
        errorClass: 'error-message',
        errorPlacement: function(error, element) {
            error.insertAfter(element);
        },
        highlight: function(element) {
            $(element).addClass('error-input');
        },
        unhighlight: function(element) {
            $(element).removeClass('error-input');
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
        
        // Check if form is valid before submitting
        if (!$(this).valid()) {
            return false;
        }

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
                // Clear existing images display
                $('#currentImages').remove();
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
        
        console.log('Edit button clicked for product ID:', productId);
        
        // First, load the product data
        $.ajax({
            url: `${productApi}/${productId}`,
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            success: function (product) {
                console.log('Product data loaded:', product);
                
                // SHOW FORM AFTER data is loaded
                $("#formContainer").show();
                $("#showFormBtn").hide();
                
                // Reset form first
                $("#productForm")[0].reset();
                
                // Clear any existing validation errors
                $("#productForm").validate().resetForm();
                $('.error-input').removeClass('error-input');
                $('.error-message').remove();
                
                // Populate form fields
                $('#productId').val(product.id);
                $('#name').val(product.name);
                $('#category').val(product.category);
                $('#description').val(product.description);
                $('#price').val(product.price);
                $('#color').val(product.color);
                $('#stock').val(product.stock);
                
                // Debug and set usage_type
                console.log('Product usage_type from API:', product.usage_type);
                console.log('Available usage_type options:', $('#usage_type option').map(function() { return this.value; }).get());
                
                // Try to set usage_type with different approaches
                if (product.usage_type) {
                    $('#usage_type').val(product.usage_type);
                    
                    // If that didn't work, try finding by text content
                    if ($('#usage_type').val() !== product.usage_type) {
                        $('#usage_type option').each(function() {
                            if ($(this).text().toLowerCase() === product.usage_type.toLowerCase() || 
                                $(this).val().toLowerCase() === product.usage_type.toLowerCase()) {
                                $(this).prop('selected', true);
                                return false;
                            }
                        });
                    }
                }
                
                console.log('Final usage_type value set:', $('#usage_type').val());
                
                // Change button text
                $('#submitBtn').text('Update Product');
                
                // Load suppliers with the selected one
                loadSuppliers(product.supplier_id);
                
                // Display existing images
                displayExistingImages(product.images || []);
                
                // Scroll to form
                $('html, body').animate({ scrollTop: $('#productForm').offset().top }, 500);
            },
            error: function (err) {
                console.error('Error loading product:', err);
                alert('Failed to load product details');
            }
        });
    });

    // Function to display existing images in edit mode
    function displayExistingImages(images) {
        // Remove any existing image display
        $('#currentImages').remove();
        
        if (images && images.length > 0) {
            let imageHTML = '<div id="currentImages" style="margin-top: 10px;"><label>Current Images:</label><div class="current-images-container">';
            
            images.forEach((image, index) => {
                imageHTML += `
                    <div class="current-image-item" style="display: inline-block; margin: 5px; position: relative;">
                        <img src="/frontend/images/${image}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; border: 1px solid #ccc;">
                        <div style="font-size: 10px; text-align: center; margin-top: 2px;">${image}</div>
                    </div>
                `;
            });
            
            imageHTML += '</div><small style="color: #666;">Upload new images to replace these</small></div>';
            
            // Insert after the file input
            $('#images').after(imageHTML);
        }
    }

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