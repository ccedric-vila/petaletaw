const express = require('express');
const router = express.Router();
const upload = require('../utils/multer'); 


// Controllers (separated)
const { registerUser } = require('../controllers/RegisterController');
const { loginUser } = require('../controllers/LoginController');
const { updateUser, getProfile } = require('../controllers/ProfileController');
const { deactivateUser } = require('../controllers/DeactivateUserController');
const { verifyEmail } = require('../controllers/VerifyEmailController');
//for VerifyAdmin
const admin = require('../middlewares/admin');
const auth = require('../middlewares/auth');



//User routes



// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

//for mailtrap
router.get('/auth/verify-email', verifyEmail);

router.post('/profile', auth, upload.single('profile_image'), updateUser);

router.get('/profile/:id', auth, getProfile);


// Admin routes
router.put('/deactivate', admin, deactivateUser);


module.exports = router;