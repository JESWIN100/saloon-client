require("dotenv").config();

const express= require('express');
const path= require('path');
const connection = require('./config/connection');
const bodyParser= require('body-parser');
const cors = require('cors');


const app= express();
const port= 3210;

// Parse JSON bodies
app.use(express.json())
// Parse URL-encoded bodies
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }))

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.urlencoded({ extended: true })); // 👈 important for form data
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// connection.connect((err) => {
//   if (err) throw err;
//   console.log('Database connected!');
// });


app.use('/',require('./router/index')); 

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
}
);