const express       = require('express')
const path          = require('path')
const session	    = require('express-session');
const app           = express()
const cookieParser  =  require('cookie-parser')
const bodyParser    = require('body-parser')
const passport		= require('passport');
const flash         = require('connect-flash');
const port          = process.env.PORT || 5000;




app.set('views', path.join(__dirname, '/views'))
app.use(express.static(__dirname + '/views'));
app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
app.use(cookieParser())
app.use(express.json());


app.use(session({
    secret: "verygoodsecret",
	resave: true,
	saveUninitialized: false,
    cookie: { maxAge: 30*24*60*60*1000 },
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


require('./routes/login')(app)
require('./routes/page')(app)
require('./routes/getdata')(app)
require('./routes/handler')(app)

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })