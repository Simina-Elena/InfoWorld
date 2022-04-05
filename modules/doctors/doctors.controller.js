
//TODO: ultimul punct de la al doilea task
const { handleEntries, handleLogin } = require('./doctors.service')

//@desc     Receive json and csv
//@route    POST /api/homework
exports.receiveEntries = (req, res) => handleEntries(req, res)

exports.login = (req, res) => handleLogin(req, res)



