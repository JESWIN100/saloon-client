const express = require('express');
const { getdatabypincode, seacrchSalonsByName, getSalonsByService } = require('../controller/home.controller');


const routes = express.Router();


routes.get('/', (req, res) => {
    
    res.render('login');
}
);

routes.get('/home', (req, res) => {
    
    res.render('landing');
}
);

routes.post('/salons-by-service', getSalonsByService);

routes.get('/search-by-name', seacrchSalonsByName);


routes.post('/get-salons-by-pincode', getdatabypincode);

module.exports = routes;