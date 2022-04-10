const {handleLogin} = require('../auth/auth.service')

exports.login = (req, res) => handleLogin(req, res)
