const express = require('express')
const routes = require('./modules/doctors/doctors.routes')
const route = require('./modules/auth/auth.routes')

express()
    .use(express.json())
    .use(express.urlencoded({ extended: true }))
    .use("/api/doctors", routes, route)
    .listen(9999, () => "Server listening on 9999");