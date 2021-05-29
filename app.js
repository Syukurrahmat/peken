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
const { Op, or, where } = require("sequelize");

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






app.get('/', async(req,res)=>{


    res.render('home', await begin(req) )
})
app.get('/search', async(req,res)=>{
    let key = req.query.key
    if(key==undefined) return res.redirect('/')

    res.render('search',{ ...await begin(req), ...{ key}})
})

app.get('/d/product-:id',async (req,res)=>{
    
    let data =  await Products.findOne({ where: { id : req.params.id }})
    if(!data) res.redirect('/')

    res.render('detail',await begin(req))
})


app.get('/g/:any', async(req,res)=>{
    let validation = {'buah':'buah' ,'sayur':'sayur', 'all':'semua' }
    let key = validation[req.params.any]
    if(key===undefined) return res.status(404).send('Not found');


    res.render('product',{...await begin(req), ...{key}})
})

app.post('/cart',async (req,res)=>{
    let id = req.body.id
    let cart = req.cookies['cartLocal'] || {}
    cart[id] = req.body.total

    if(!req.isAuthenticated()){
        for (let key of Object.keys(cart)) if(cart[key]=='0') delete cart[key]
        res.cookie('cartLocal', cart ,{ maxAge: 30*24*60*60*1000 ,httpOnly:true })
    }else{
        res.clearCookie('cartLocal')
        let data =  await Users.findOne({ attributes:['id','cartList'], where: { id : req.user.id }})
        let cartdb = JSON.parse(data.cartList) || {}
        cart = Object.assign(cartdb, cart)
        for (let key of Object.keys(cart)) if(cart[key]=='0') delete cart[key]
        data.cartList = cart
        data.save()
    }

    let sc = await sumcart(cart)
    
    res.json({totHarga:sc.totHarga , count:sc.count})
})

app.get('/detail', async(req,res)=>{
    let data =  await Products.findAll({ where: { id : req.query.id }})
    data = setOnCart(req,data)
    res.json(data[0])
})

async function begin(req){
    let username = (req.isAuthenticated())? req.user.name : 'login'

    let cart = (req.isAuthenticated())? JSON.parse(req.user.cartList) : req.cookies['cartLocal'] || {}

    let sc = await sumcart(cart)


    let totHarga = (sc.totHarga==0)? '' : new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"})
         .format(sc.totHarga)
         .replace('IRD','Rp.')
         .replace(',00','')

    let count = (sc.count==0)? '' : sc.count


    let sortInputList = {'price-asc':'Harga Terendah','price-desc':'Harga Tertinggi','abjad-asc':'A - Z','abjad-desc':'Z - A'}

    let sortInput = (req.query.sortby)? sortInputList[req.query.sortby] : 'Paling sesuai'


    return{ username , totHarga , count, sortInput}
}





async function sumcart(cart){

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
    let count = Object.keys(cart).length
    return {totHarga,count}
}

app.get('/topProduct',async (req,res)=>{
    let data =  await Products.findAll({
       attribute0s:['id', 'productName', 'image', 'note', 'price','stock'],
       where:{top:true},
       order: sequelize.random(),
       limit: 5
    }); 
    
    data = setOnCart(req,data)

    res.json({data})
})


app.get('/getProduct',async (req,res)=>{

    let sortValidation = {'none':'none', 'price':'price','abjad':'productName'}
    let orderValidation = ['NONE','DESC','ASC']

    let categoryValidation = { buah:'fruits',sayur:'vegetables',all:'all' ,search:'search' }
    
    let category = categoryValidation[req.query.c]

    let sort = sortValidation[req.query.sortby.split('-')[0]]
    let order = req.query.sortby.split('-')[1].toUpperCase()

    if(!orderValidation.includes(order)) return res.status(404).send('Not found');
    if(category===undefined) return res.status(404).send('Not found');
    if(sort===undefined) return res.status(404).send('Not found');
    
    let orderConcat = sort+' '+order
    let key = req.query.key

    let whereQuery = null
    if(category !=='all') whereQuery = {category:category}
    if(key !== undefined && category == 'search')  whereQuery = {productName : { [Op.substring] : key }} 


    let orderQuery = (orderConcat == 'none NONE')? sequelize.literal('rand(159)') : sequelize.literal(orderConcat)

    let data =  await Products.findAll({
        attributes:['id','category', 'productName', 'image', 'note', 'price','stock'],
        where: whereQuery,
        order: orderQuery,
        limit: Number(req.query.many),
        offset: Number(req.query.offset),

     }); 

     data = setOnCart(req,data)

     res.json({data})
})

function setOnCart(req,data){
    let iddata = data.map(e=>e.id)

    let oncart = (req.isAuthenticated())? JSON.parse(req.user.cartList) : req.cookies['cartLocal'] ||{}

    for (let key of Object.keys(oncart)){
        let ind = iddata.indexOf(Number(key))
        if(ind!=-1){
            data[ind].dataValues['oncart'] = oncart[key]
        }
    }
    return data
}

app.get('/relateProduct', async(req,res)=>{
    let id = req.query.id

    let name =  await Products.findOne({attributes:['productName'], where: {id}})
    
    let similar = name.productName.split(' ')

    let whereQuery= []
    similar.forEach(e=>{
        if(e.length>3) whereQuery.push({[Op.substring] : e })
    })

    let data =  await Products.findAll({
        attributes:['id','category', 'productName', 'image', 'note', 'price','stock'],
        where: {
            [Op.and] : [
                { productName :{[Op.or] : whereQuery}},
                { [Op.not]: [{ id: id }]}
            ],
        },
        order:sequelize.random(),
        limit: 5,
    }); 
    data = setOnCart(req,data)
    res.json({data})
})

app.get('/login',(req,res)=>{
    req.flash('currentUrl',req.headers.referer)
    res.redirect('/auth/google')
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect(req.flash('currentUrl'));
});




app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })