const express = require('express');
const { getdatabypincode } = require('../controller/home.controller');
const { crateuser, verify, getUserProfile, updateUserProfile } = require('../controller/authController');
const upload = require('../config/multer');


const routes = express.Router();

routes.get('/profile', (req, res) => {
    
    res.render('profile');
}
);

routes.get('/user-data/:id',getUserProfile)

routes.post('/send-otp',crateuser)
routes.post('/verify-otp',verify)

routes.put("/profile-edit/:id",upload.single('profile_image'), updateUserProfile); 

module.exports = routes;                                              