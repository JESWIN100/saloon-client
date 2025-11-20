const express = require('express');
const homeRouter = require('./router.home');
const salonRouter = require('./saloon.route');
const bookingRouter = require('./router.booking');
const authRouter = require('./router.auth');
const serviceRouter = require('./service.route');
const locationRouter=require('./router.location')
const reviewRouter=require('./router.review')
const router = express.Router();



router.use('/',homeRouter)
router.use('/salon',salonRouter)
router.use('/booking',bookingRouter)
router.use('/auth',authRouter)
router.use('/services',serviceRouter)
router.use('/location',locationRouter)
router.use('/review',reviewRouter)



module.exports = router;