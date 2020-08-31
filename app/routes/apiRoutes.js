module.exports = (app) => {
    const students = require('../controllers/apiController.js');

    // Create a new Student
    app.post('/register', students.register);

    // suspend a Student
    app.post('/suspend', students.suspend);

    // Retrieve notification Student List
    app.post('/retrievefornotifications', students.retrievefornotifications);

    // Retrieve common Student
    app.get('/commonStudents', students.commonStudents);
}