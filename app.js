const express = require('express')
const app = express()
const bodyParser = require('body-parser')

//Route file
const routes = require('./modules/doctors/doctors.routes')

//configure app
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.listen(9999)

//Mount routers
app.use('/api/doctors', routes)

