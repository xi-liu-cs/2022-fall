let express = require('express'),
app = express(),
axios = require('axios'),
morgan = require('morgan'),
multer = require('multer'),
dotenv = require('dotenv'),
cors = require('cors'),
body_parser = require('body-parser');
dotenv.config({silent: true});

app.use(cors());
app.use(body_parser.urlencoded({extended: false}));
app.use(body_parser.json());
app.use(express.json());

const DBconfig = require("./DBconfig");
DBconfig();

const locationRouter = require('./routes/locations');
const groupRouter = require('./routes/groups');
let search_router = require('./routes/search');
let test_router = require('./routes/test');

app.use('/locations', locationRouter);
app.use('/groups', groupRouter);
app.use('/search', search_router);
app.use('/test', test_router);
app.use('/static', express.static('public'));
app.get('/', (req, res) => 
{
  res.json('');
});

module.exports = app;