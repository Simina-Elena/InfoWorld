const {receiveEntries} = require('./doctors.controller')
const {authenticateToken} = require('../auth/auth.service')

module.exports = require('express')
    .Router().post('/', authenticateToken, receiveEntries)
