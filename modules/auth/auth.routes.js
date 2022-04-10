const {login} = require("./auth.controller");

module.exports = require('express')
    .Router().post('/login', login)
