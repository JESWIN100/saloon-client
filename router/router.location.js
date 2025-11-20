
const express = require('express');
const { getlocation, searchlocation } = require('../controller/location');

const routes = express.Router();


routes.get("/reverse",getlocation)
routes.get("/search",searchlocation)
module.exports = routes;