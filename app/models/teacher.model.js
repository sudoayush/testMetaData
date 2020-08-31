const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeacherSchema = mongoose.Schema({
    name: String,
    email: String,
    students: Object
}, {
    timestamps: true
});

module.exports = mongoose.model('Teacher', TeacherSchema);