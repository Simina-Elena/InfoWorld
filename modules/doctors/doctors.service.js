const csvToJson = require("csvtojson");
const {checkObjectsForIdsAndNames, populateOutputCSV, logInformationCSV} = require("../utils/csv");
const {checkFacilitiesForJson, checkIdAndResourceType} = require("../utils/json");
require('dotenv').config()

exports.handleEntries = (req, res) => {
    if (req.user) {
        const body = req.body
        const user = req.user.user
        if (req.get("Content-Type") === "application/json") {
            checkFacilitiesForJson(req, body.facility)

            if (body.active && req.facilityFlag) {
                checkIdAndResourceType(body, user, res)
            } else {
                return res.status(400).send('Status inactive or facility discrepancy!')
            }

        } else if (req.get("Content-Type") === 'text/csv') {
            const data = []
            let content = null
            req.output = {}
            let objForCheck = {}
            req.sameIdDifNameFlag = false
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
                        checkObjectsForIdsAndNames(req, objForCheck, entry)
                        populateOutputCSV(req.sameIdDifNameFlag, req.output, user.facility, entry)
                    })
                    logInformationCSV(req, res)
                })
            })
        }
    }
}

