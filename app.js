const express       = require('express')
const path          = require('path')
const session	    = require('express-session');
const app           = express()
const cookieParser  =  require('cookie-parser')
const bodyParser    = require('body-parser')
const passport		= require('passport');
const flash         = require('connect-flash');

const port          = process.env.PORT || 5000;
const {Products,sequelize, Users} = require('./config/db')
const { Op } = require("sequelize");

const {isLoggedIn, isLoggedOut} = require('./config/passport');

app.set('views', path.join(__dirname, '/views'))
app.use(express.static(__dirname + '/views'));
app.set('view engine', 'ejs')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}))
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






app.get('/',(req,res)=>{
    res.render('home')
})
app.get('/g/:any',(req,res)=>{
    res.render('product')
})

app.post('/cart',async (req,res)=>{
    let id = req.body.id

    let cart = req.cookies['cartLocal'] || {}
    
    cart[id] = req.body.total
     
    
    if(!req.isAuthenticated()){
        for (let key of Object.keys(cart)) if(cart[key]=='0') delete cart[key]
        res.cookie('cartLocal', cart ,{ maxAge: 30*24*60*60*1000, httpOnly: true , secure:true })
    }else{
        res.clearCookie('cartLocal')
        let data =  await Users.findOne({ attributes:['id','cartList'], where: { id : req.user.id }})
        let cartdb = JSON.parse(data.cartList) || {}

        cart = Object.assign(cartdb, cart)
        for (let key of Object.keys(cart)) if(cart[key]=='0') delete cart[key]
        
        data.cartList = cart
        data.save()
    }

    let qr =[]
    
    for (let key of Object.keys(cart)) qr.push({'id':Number(key)})

    let harga = await Products.findAll({ attributes:['id','price'],where: {[Op.or]: qr}})
    
    let hargaList = {}
    harga.forEach(e=>{
        let a = Object.values(e)
        hargaList[a[0].id] = a[1].price 
    })

    let totHarga = 0
    for (let key of Object.keys(cart)) totHarga += cart[key]*hargaList[key]
    
    res.json(totHarga)
})


app.get('/topProduct',async (req,res)=>{
    let data =  await Products.findAll({
       attributes:['id', 'productName', 'image', 'note', 'price','stock'],
       where:{top:true},
       order: sequelize.random(),
       limit: 5
    }); 
    let iddata = data.map(e=>e.id)

    let oncart = (req.isAuthenticated())? JSON.parse(req.user.cartList) : req.cookies['cartLocal'] ||{}

    // data =
    // console.log(dat)

    for (let key of Object.keys(oncart)){
        let ind = iddata.indexOf(Number(key))
        console.log(key , ind)
        if(ind!=-1){
            data[ind].dataValues['oncart'] = oncart[key]
        }
    }

    console.log(oncart)
    console.log(data)


    res.json({data})
})


app.get('/getProduct:what',(res,req)=>{
    console.log(req.get('Referrer'))
})





app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});









app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })