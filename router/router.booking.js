const express = require('express');
const { createBooking, booking_razopay, razopay_success, getBookingsByCustomerId, getBookingById, cancellBooking } = require('../controller/booking');

const routes = express.Router();


routes.get('/details', (req, res) => {
    
    res.render('booking-details');
}
);

routes.get('/detailsbyid/:id', (req, res) => {
    
    res.render('booking-detailsbyid');
}
);

routes.post('/now/:id',createBooking)

routes.post('/razorpay',booking_razopay)

routes.post('/success/:id',razopay_success)


routes.get('/bookingdetails/:id',getBookingsByCustomerId)

routes.get('/bookingbyid/:id',getBookingById)

routes.post('/cancelService/:detailId',cancellBooking)

module.exports = routes;