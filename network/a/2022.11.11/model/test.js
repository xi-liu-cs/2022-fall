let mongoose = require("mongoose"),
schema = mongoose.Schema;

let test_schema = new schema
({
    idx: {type: String, required: false},
    a: {type: Array, required: false}
});

let test = mongoose.model('test', test_schema);
module.exports = test;