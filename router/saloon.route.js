const express = require('express');
const { getdatabyId } = require('../controller/salon.controller');



const routes = express.Router();


routes.get('/slot-booking/:id', (req, res) => {
    
    res.render('salon');
}
);


routes.get('/salon-details/:id',getdatabyId)

module.exports = routes;