const express = require('express')
const {receiveEntries, login} = require('./doctors.controller')
const router = express.Router()
const {authenticateToken} = require('./doctors.service')

router.route('/').post([authenticateToken, receiveEntries])
router.route('/login').post(login)

module.exports = router
