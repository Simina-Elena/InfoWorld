exports.checkObjectsForIdsAndNames = (req, objForCheck, entry) => {
    for (const [key, value] of Object.entries(objForCheck)) {
        if (entry.ID === value && entry.FamilyName + ' ' + entry.GivenName !== key) {
            req.sameIdDifNameFlag = true;
        }
    }
}

exports.populateOutputCSV = (sameIdDifName, output, facility, entry) => {
    if (sameIdDifName !== true) {
        if (entry.Active === 'true' && facility.includes(entry.FacilityId)) {
            if (output[entry.FamilyName + ' ' + entry.GivenName]) {
                output[entry.FamilyName + ' ' + entry.GivenName].push(entry.NameId);
            } else {
                output[entry.FamilyName + ' ' + entry.GivenName] = [entry.NameId];
            }
        }
    }
}

exports.logInformationCSV = (req, res) => {
    if (isEmptyObject(req.output)) {
        return res.status(400).send('You are using the same ID with different names!')
    }
    for (const [key, value] of Object.entries(req.output)) {
        let s = key + ': ' + value.join(', ')
        console.log(s)
    }
    console.log("---------------------------")
    return res.status(200).send('Information logged to the console.')
}

function isEmptyObject(obj) {
    for (let name in obj) return false;
    return true;
}