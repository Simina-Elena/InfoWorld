const jwt = require("jsonwebtoken");
const csvToJson = require("csvtojson");
require('dotenv').config()
const ids = []

authenticateToken = (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token === null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // console.log(user)
        if (err) return res.sendStatus(403)
        if (user.user.roles.includes('Practitioner') || user.user.roles.includes('Admin')) {
            req.user = user
        } else {
            res.sendStatus(401).json('Access denied')
        }
    })
}
//TODO: check when we don't have a user (token)
const checkFacilitiesForJson = (req, facility) => {
    const facilities = []
    facility.forEach((el) => {
        facilities.push(el.value)
    })
    req.flag = facilities.every(el => req.user.user.facility.includes(el)) === true;
}

const checkFacilitiesForCSV = (req, obj) => {
    const facilities = []
    obj.map((entity) => {
        facilities.push(entity.FacilityId)
    })
    req.flag = facilities.every(el => req.user.user.facility.includes(el)) === true;
}


exports.handleEntries = (req, res) => {
    authenticateToken(req, res)
    const body = req.body
    if (req.get("Content-Type") === "application/json") {
        checkFacilitiesForJson(req, body.facility)
        if (body.id === undefined) {
            return res.status(400).send('Id is not provided!')
        }

        if (body.resourceType !== 'Practitioner') {
            return res.status(400).send('Wrong resource type!')
        }

        if (body.active === true) {
            if (req.flag === true) {
                if (ids.includes(body.id)) {
                    return res.status(400).send('You are using the same id!')
                } else {
                    ids.push(body.id)
                }
                for (let i = 0; i < body.name.length; i++) {
                    console.log('Family name: ' + body.name[i].family)
                    console.log('Given name: ' + body.name[i].given)
                    console.log('Full name: ' + body.name[i].text)
                }
                for (let i = 0; i < body.facility.length; i++) {
                    console.log(body.facility[i].value + '. ' + 'Facility name: ' + body.facility[i].name
                        + ' --- ' + 'System: ' + body.facility[i].system)
                }
                res.status(200).send('Information logged to the console.')
            } else {
                return res.status(400).send('Facility discrepancy')
            }
        } else {
            return res.status(400).send('Status is not active!')
        }

    } else if (req.get("Content-Type") === 'text/csv') {
        const data = []
        let content = null
        let output = {}

        req.on('data', (chunk) => {
            data.push(chunk)
        })
        req.on('end', () => {
            content = Buffer.concat(data)
            csvToJson().fromString(content.toString()).then((obj) => {
                console.log(obj)
                checkFacilitiesForCSV(req, obj)
                console.log(req.flag)
                obj.map((entry) => {
                    if (entry.Active === 'true' && req.flag === true) {
                        if (output[entry.FamilyName + ' ' + entry.GivenName]) {
                            output[entry.FamilyName + ' ' + entry.GivenName].push(entry.NameId);
                        } else {
                            output[entry.FamilyName + ' ' + entry.GivenName] = [entry.NameId];
                        }
                    }
                })
                for (const [key, value] of Object.entries(output)) {
                    let s = key + ': '
                    for (let i = 0; i < value.length; i++) {
                        s += value[i] + ', '
                    }
                    console.log(s.substring(0, s.length - 2))
                }
            })
        })
    }
}

exports.handleLogin = (req, res) => {
    //Mock user
    const user = {
        'authenticated': true,
        'facility': ['12', '13'],
        'roles': [
            'Practitioner'
        ]
    }

    jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {issuer: 'JWT Builder'}, (err, token) => {
        res.json({
            token
        })
    })
}