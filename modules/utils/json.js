const ids = []

exports.checkFacilitiesForJson = (req, facility) => {
    const facilities = facility.map((el) => el.value)
    const user = req.user.user
    req.facilityFlag = facilities.some(el => user.facility.includes(el));
}

exports.checkIdAndResourceType = (body, user, res) => {
    if (body.id === undefined) {
        return res.status(400).send('Id is not provided!')
    }

    if (body.resourceType !== 'Practitioner') {
        return res.status(400).send('Wrong resource type!')
    }

    if (ids.includes(body.id)) {
        return res.status(400).send('You are using the same id!')
    }
    ids.push(body.id)
    logInformationJSON(body, user, res)
}

function logInformationJSON(body, user, res) {
    body.name.forEach((name) => {
        console.log(`Family name: ${name.family} \n Given name: ${name.given} \n Full name: ${name.text}`)
    })

    body.facility.forEach((facility) => {
        if (user.facility.includes(facility.value)) {
            console.log(`${facility.value}. Facility name: ${facility.name}\nSystem: ${facility.system}`)
        }
    })
    console.log("-----------------------------------------")
    return res.status(200).send('Information logged to the console.')
}
