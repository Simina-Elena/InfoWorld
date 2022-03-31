const express = require('express')
const { receiveJson, login } = require('../controllers/routes')
const router = express.Router()

router.route('/').post(receiveJson)
router.route('/login').post(login)

module.exports = router
