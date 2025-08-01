const mongoose = require('mongoose');
const StartupSchema= new mongoose.Schema({
    name: {type: String, required: true},
    description: {type: String, required: true},
    link: {type: String, required: true},
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})