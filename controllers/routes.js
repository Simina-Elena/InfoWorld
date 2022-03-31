//@desc     Receive json and csv
//@route    POST /api/homework
//@access   Private

require('dotenv').config()
const csvToJson = require("csvtojson");
const jwt = require('jsonwebtoken')
const ids = []

authenticateToken = (req, res) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token === null) return res.sendStatus(401)

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        // console.log(user)
        if (err) return res.sendStatus(403)
        if (user.user.roles.includes('Practitioner') || user.user.roles.includes('Admin')) {
            res.json({
                message: 'Access granted',
                user
            })
            req.user = user
        } else {
            res.sendStatus(401).json('Access denied')
        }
    })
}

const checkFacilities = (req, facility, next) => {
    console.log(req.user.user.facility)
    console.log(facility)
    req.user.user.facility.forEach((fac) => {
        facility.forEach((facu) => {
            if(fac !== facu.value){
               req.check = false
            }
        })
    })
    req.check = true
}

exports.receiveJson = (req, res) => {
    authenticateToken(req, res)
    const body = req.body
    checkFacilities(req, body.facility)
    console.log(req.check)
    if (req.get("Content-Type") === "application/json") {
        if (body.active === true) {
            if (req.check !== false) {
                for (let i = 0; i < body.name.length; i++) {
                    console.log('Family name: ' + body.name[i].family)
                    console.log('Given name: ' + body.name[i].given)
                    console.log('Full name: ' + body.name[i].text)
                }
                for (let i = 0; i < body.facility.length; i++) {
                    console.log(body.facility[i].value + '. ' + 'Facility name: ' + body.facility[i].name
                        + ' --- ' + 'System: ' + body.facility[i].system)
                }
            }
        } else {
            console.log('Status is not active')
        }
        if (body.id === undefined) {
            return res.status(400).send('Id is not provided!')
        }
        if (ids.includes(body.id)) {
            return res.status(400).send('You are using the same id!')
        } else {
            ids.push(body.id)
        }
        if (body.resourceType !== 'Practitioner') {
            return res.status(400).send('Wrong resource type!')
        }
        console.log(ids)
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
                obj.map((entry) => {
                    if (entry.Active === 'true') {
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

exports.login = (req, res) => {
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


