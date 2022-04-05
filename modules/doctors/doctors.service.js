const jwt = require("jsonwebtoken");
const csvToJson = require("csvtojson");
require('dotenv').config()
const ids = []

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

const checkFacilitiesForJson = (req, facility) => {
    const facilities = []
    const user = req.user.user
    facility.forEach((el) => {
        facilities.push(el.value)
    })
    req.facilityFlag = facilities.some(el => user.facility.includes(el)) === true;
}

const checkIdAndResourceType = (body, user, res) => {
    if (body.id === undefined) {
        return res.status(400).send('Id is not provided!')
    }

    if (body.resourceType !== 'Practitioner') {
        return res.status(400).send('Wrong resource type!')
    }

    if (ids.includes(body.id)) {
        return res.status(400).send('You are using the same id!')
    } else {
        ids.push(body.id)
    }
    logInformation(body, user, res)
}

const logInformation = (body, user, res) => {
    for (let i = 0; i < body.name.length; i++) {
        console.log('Family name: ' + body.name[i].family)
        console.log('Given name: ' + body.name[i].given)
        console.log('Full name: ' + body.name[i].text)
    }
    for (let i = 0; i < body.facility.length; i++) {
        if (user.facility.includes(body.facility[i].value)) {
            console.log(body.facility[i].value + '. ' + 'Facility name: ' + body.facility[i].name
                + ' --- ' + 'System: ' + body.facility[i].system)
        }
    }
    console.log("-----------------------------------------")
    return res.status(200).send('Information logged to the console.')
}

exports.handleEntries = (req, res) => {
    // authenticateToken(req, res)
    if(req.user) {
        const body = req.body
        const user = req.user.user
        if (req.get("Content-Type") === "application/json") {
            checkFacilitiesForJson(req, body.facility)

            if (body.active === true && req.facilityFlag === true) {
                checkIdAndResourceType(body, user, res)
            } else {
                return res.status(400).send('Status inactive or facility discrepancy!')
            }

        } else if (req.get("Content-Type") === 'text/csv') {
            const data = []
            let content = null
            req.output = {}
            let objForCheck = {}
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
                        // for (const [key, value] of Object.entries(objForCheck)) {
                        //     if (entry.ID === value && entry.FamilyName + ' ' + entry.GivenName !== key) {
                        //         flag = false
                        //     }
                        // }
                        checkObjectsForIdsAndNames(req, objForCheck, entry)
                        // if (req.sameIdDifNameFlag !== true) {
                        //     if (entry.Active === 'true' && user.facility.includes(entry.FacilityId)) {
                        //         if (output[entry.FamilyName + ' ' + entry.GivenName]) {
                        //             output[entry.FamilyName + ' ' + entry.GivenName].push(entry.NameId);
                        //         } else {
                        //             output[entry.FamilyName + ' ' + entry.GivenName] = [entry.NameId];
                        //         }
                        //     }
                        // }
                        populateOutput(req, user, entry)
                    })
                    logInformationCSV(req, res)
                    // if (isEmptyObject(req.output) === true) {
                    //     return res.status(400).send('You are using the same ID with different names!')
                    // } else {
                    //     for (const [key, value] of Object.entries(req.output)) {
                    //         let s = key + ': '
                    //         for (let i = 0; i < value.length; i++) {
                    //             s += value[i] + ', '
                    //         }
                    //         console.log(s.substring(0, s.length - 2))
                    //     }
                    //     console.log("---------------------------")
                    //     return res.status(200).send('Information logged to the console.')
                    // }
                })
            })
        }
    }
}

const logInformationCSV = (req, res) => {
    if (isEmptyObject(req.output) === true) {
        return res.status(400).send('You are using the same ID with different names!')
    } else {
        for (const [key, value] of Object.entries(req.output)) {
            let s = key + ': '
            for (let i = 0; i < value.length; i++) {
                s += value[i] + ', '
            }
            console.log(s.substring(0, s.length - 2))
        }
        console.log("---------------------------")
        return res.status(200).send('Information logged to the console.')
    }
}

const checkObjectsForIdsAndNames = (req, objForCheck, entry) => {
    for (const [key, value] of Object.entries(objForCheck)) {
        if (entry.ID === value && entry.FamilyName + ' ' + entry.GivenName !== key) {
            req.sameIdDifNameFlag = true;
        }
    }
}

const populateOutput = (req, user, entry) => {
    if (req.sameIdDifNameFlag !== true) {
        if (entry.Active === 'true' && user.facility.includes(entry.FacilityId)) {
            if (req.output[entry.FamilyName + ' ' + entry.GivenName]) {
                req.output[entry.FamilyName + ' ' + entry.GivenName].push(entry.NameId);
            } else {
                req.output[entry.FamilyName + ' ' + entry.GivenName] = [entry.NameId];
            }
        }
    }
}

exports.handleLogin = (req, res) => {
    //Mock user
    const user = {
        'authenticated': true,
        'facility': ['12', '13'],
        'roles': [
            'Admi'
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