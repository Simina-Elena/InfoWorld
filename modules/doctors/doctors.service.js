const jwt = require("jsonwebtoken");
const csvToJson = require("csvtojson");
require('dotenv').config()
const ids = []

const authenticateToken = (req, res) => {
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
}

const checkFacilitiesForJson = (req, facility) => {
    const facilities = []
    const user = req.user.user
    facility.forEach((el) => {
        facilities.push(el.value)
    })
    req.facilityFlag = facilities.some(el => user.facility.includes(el)) === true;
}

exports.handleEntries = (req, res) => {
    authenticateToken(req, res)
    if(req.user) {
        const body = req.body
        const user = req.user.user
        if (req.get("Content-Type") === "application/json") {
            if (body.id === undefined) {
                return res.status(400).send('Id is not provided!')
            }

            if (body.resourceType !== 'Practitioner') {
                return res.status(400).send('Wrong resource type!')
            }

            checkFacilitiesForJson(req, body.facility)

            if (body.active === true && req.facilityFlag === true) {
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
                    if (user.facility.includes(body.facility[i].value))
                        console.log(body.facility[i].value + '. ' + 'Facility name: ' + body.facility[i].name
                            + ' --- ' + 'System: ' + body.facility[i].system)
                }
                res.status(200).send('Information logged to the console.')

            } else {
                return res.status(400).send('Status inactive or facility discrepancy!')
            }

        } else if (req.get("Content-Type") === 'text/csv') {
            const data = []
            let content = null
            let output = {}
            let objForCheck = {}
            let flag = true
            req.on('data', (chunk) => {
                data.push(chunk)
            })
            req.on('end', () => {
                content = Buffer.concat(data)
                csvToJson().fromString(content.toString()).then((obj) => {
                    obj.forEach((entry) => {
                        objForCheck[entry.FamilyName + ' ' + entry.GivenName] = entry.ID
                    })
                    obj.forEach((entry) => {
                        for (const [key, value] of Object.entries(objForCheck)) {
                            if (entry.ID === value && entry.FamilyName + ' ' + entry.GivenName !== key) {
                                flag = false
                            }
                        }
                        if (flag === true) {
                            if (entry.Active === 'true' && user.facility.includes(entry.FacilityId)) {
                                if (output[entry.FamilyName + ' ' + entry.GivenName]) {
                                    output[entry.FamilyName + ' ' + entry.GivenName].push(entry.NameId);
                                } else {
                                    output[entry.FamilyName + ' ' + entry.GivenName] = [entry.NameId];
                                }
                            }
                        }
                    })

                    if (isEmptyObject(output) === true) {
                        return res.status(400).send('You are using the same ID with different names!')
                    } else {
                        for (const [key, value] of Object.entries(output)) {
                            let s = key + ': '
                            for (let i = 0; i < value.length; i++) {
                                s += value[i] + ', '
                            }
                            console.log(s.substring(0, s.length - 2))
                        }
                        return res.status(200).send('Information logged to the console.')
                    }
                })
            })
        }
    }

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
            res.sendStatus(400)
        }
        res.json({
            token
        })
    })
}

function isEmptyObject(obj) {
    for (let name in obj) return false;
    return true;
}