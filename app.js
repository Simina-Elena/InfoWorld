const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { receiveJson, login } = require('./controllers/routes')


//Route files
const routes = require('./routes/routes')
const jwt = require("jsonwebtoken");

app.listen(9999)

//configure app
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

//Mount routers
app.use('/api/homework', routes)

// app.post('/api/homework', authenticateToken, receiveJson)