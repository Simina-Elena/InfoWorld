const express = require('express')
const {receiveEntries, login} = require('./doctors.controller')
const router = express.Router()

router.route('/').post(receiveEntries)
router.route('/login').post(login)

module.exports = router
