const jwt = require("jsonwebtoken");

exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['x-vamf-jwt'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token === null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        if (user.user.roles.includes('Practitioner') || user.user.roles.includes('Admin')) {
            req.user = user
        } else {
            res.status(401).send('Access denied for that role.')
        }
    })
    next()
}

exports.handleLogin = (req, res) => {
    //Mock user
    const user = {
        'authenticated': true,
        'facility': ['12', '13'],
        'roles': [
            'Admin'
        ]
    }

    jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {issuer: 'JWT Builder'}, (err, token) => {
        if (err) {
            res.sendStatus(403)
        }
        res.json({
            token
        })
    })
}
