const connection = require('../config/db');

exports.createProduct = (req, res) => {
    const {
        name, category, usage_type, description,
        price, color, stock, supplier_id
    } = req.body;

    // Handle both single and multiple images
    let imageValue = null;
    if (req.files) {
        // Combine all images into a comma-separated string
        const allFiles = [
            ...(req.files.image || []),
            ...(req.files.images || [])
        ];
        imageValue = allFiles.map(file => file.filename).join(',');
    }

    const sql = `
        INSERT INTO products (name, category, usage_type, description, 
        price, color, stock, image, supplier_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    connection.query(sql, [
        name, category, usage_type, description,
        price, color, stock || 0,
        imageValue, // Will be string like "img1.jpg,img2.jpg,img3.jpg"
        supplier_id
    ], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Failed to create product',
                details: err.message 
            });
        }
        res.status(201).json({ 
            message: 'Product added', 
            id: result.insertId,
            images: imageValue ? imageValue.split(',') : []
        });
    });
};

exports.getProducts = (req, res) => {
    const sql = `
        SELECT p.*, s.supplier_name 
        FROM products p 
        LEFT JOIN supplier s ON p.supplier_id = s.id
    `;
    connection.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

exports.getProductById = (req, res) => {
    const { id } = req.params;
    connection.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'Product not found' });
        
        // Convert comma-separated images to array
        const product = results[0];
        if (product.image) {
            product.images = product.image.split(',');
        } else {
            product.images = [];
        }
        
        res.json(product);
    });
};

exports.updateProduct = (req, res) => {
    const { id } = req.params;
    const {
        name, category, usage_type, description,
        price, color, stock, supplier_id
    } = req.body;

    let sql = `UPDATE products SET 
        name = ?, category = ?, usage_type = ?, description = ?,
        price = ?, color = ?, stock = ?, supplier_id = ?`;
    
    const params = [
        name, category, usage_type, description,
        price, color, stock || 0, supplier_id
    ];

    if (req.files) {
        // Combine new images with existing ones if needed
        const allFiles = [
            ...(req.files.image || []),
            ...(req.files.images || [])
        ];
        sql += `, image = ?`;
        params.push(allFiles.map(file => file.filename).join(','));
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    connection.query(sql, params, (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Failed to update product',
                details: err.message 
            });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product updated successfully' });
    });
};

exports.deleteProduct = (req, res) => {
    const { id } = req.params;
    connection.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted successfully' });
    });
};