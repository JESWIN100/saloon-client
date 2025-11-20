const express = require('express');

const { addReview, getSalonRatingStats, check } = require('../controller/reviewController');



const routes = express.Router();



routes.post('/add',addReview)
routes.get('/:salon_id',getSalonRatingStats)
routes.get('/check/:bookingId/:customer_id',check)

module.exports = routes;