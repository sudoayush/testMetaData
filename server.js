const express = require('express');
const bodyParser= require('body-parser');
const helmet = require("helmet");
const app = express();

app.use(helmet());

const dbConfig = require('./config/database.config.js');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose.connect(dbConfig.url, {
    useNewUrlParser: true
}).then(() => {
    console.log("Successfully connected to the database");    
}).catch(err => {
    console.log('Could not connect to the database. Exiting now...', err);
    process.exit();
});
// Make sure you place body-parser before your CRUD handlers!
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())


require('./app/routes/apiRoutes.js')(app);

app.listen(8080, function() {
    console.log('listening on 8080')
})