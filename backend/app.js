const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');





app.use(cors())


// app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'images')))




module.exports = app