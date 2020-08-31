const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StudentSchema = mongoose.Schema({
    name: String,
    email: String,
    teachers: Object,
    suspend: Object,
}, {
    timestamps: true
});

module.exports = mongoose.model('Student', StudentSchema);