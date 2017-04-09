let express = require('express')
let path = require('path')
let favicon = require('serve-favicon')
let logger = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let MongoClient = require('mongodb').MongoClient
let helmet = require('helmet')
let config = require('config')

let app = express()

app.use(helmet())


// Modules
let homepage = require('./modules/homepage')
let AuthenticationModule = require('./modules/authentication')
let PackageSync = require('./modules/package-sync')


// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))







let auth = new AuthenticationModule()
let packageSync = new PackageSync()


app.use('/', homepage)
app.use('/authentication', auth.getRouting())
app.use('/package-sync', packageSync.getRouting())



// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Page Not Found')
    err.status = 404
    next(err)
});


// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500)
        res.render('error', {
            message: err.message,
            error: err
        })
    })
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500)
    res.render('error', {
        message: err.message,
        error: {}
    })
})



module.exports = app
