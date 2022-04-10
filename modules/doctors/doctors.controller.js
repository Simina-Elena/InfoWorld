const { handleEntries} = require('./doctors.service')

exports.receiveEntries = (req, res) => handleEntries(req, res)





