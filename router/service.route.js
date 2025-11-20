
const express = require('express');
const { getservices, getServicesByGender } = require('../controller/service.controller');


const routes = express.Router();


routes.post('/services-by-gender', getServicesByGender);


routes.get('/',getservices)

module.exports = routes;