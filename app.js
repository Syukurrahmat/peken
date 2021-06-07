var qs = require("querystring");
const express       = require('express')
const path          = require('path')
const session	    = require('express-session');
const app           = express()
const cookieParser  =  require('cookie-parser')
const bodyParser    = require('body-parser')
const passport		= require('passport');
const flash         = require('connect-flash');
const port          = process.env.PORT || 5000;
const {Products,sequelize, Users ,Order} = require('./config/db')
const { Op, or, where } = require("sequelize");
const axios = require('axios');
const stringSimilarity = require("string-similarity");
const randomstring = require("randomstring");

var FormData = require('form-data');
const {isLoggedIn, isLoggedOut} = require('./config/passport');


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

app.get('/cart',(req,res)=>{
    
    res.render('cart',{username:(req.isAuthenticated())? req.user.name : 'login'})
})
app.get('/checkout', async (req,res)=>{
    
    
    res.render('checkout',{username:(req.isAuthenticated())? req.user.name : 'login' , address : (req.user.address)? JSON.parse(req.user.address).strAddress : null})
})

app.get('/getOngkir',async(req,res)=>{
    
    let totHarga = (await sumcart(req)).totHarga
    if(req.user.address==null) return res.json({error:'Alamat belum ditetapkan' , totHarga})
    
    let destination = String(JSON.parse(req.user.address).cityID_RO)
    
    let estimatedWeight = {
        kg : 1000,
        pcs : 250,
        pack : 700,
        sisir : 950, 
    }
    let cart = JSON.parse(req.user.cartList)
    let whereQuery = Object.keys(cart).map(e=>{return {id:e}})
    let units = await Products.findAll({ attributes:['id','units'] ,where : {[Op.or] : whereQuery }})
    let weight = 0 
    
    units.forEach(e=> weight += cart[e.id] * estimatedWeight[e.units])
    
    weight = (weight>30000)? 3000 : weight 
    
    let ongkir_res
    let kurir = ['jne', 'pos' ,'tiki']
    let i = 0
    
    while(true){
        ongkir_res = await axios({
            method: 'POST',
            url: 'https://api.rajaongkir.com/starter/cost',
            headers: {
                "key": "2dcea8f7f70b198105982c307cbcdd7b",
                "content-type": "application/x-www-form-urlencoded",
            },
            data : qs.stringify({origin: '427', destination: destination , weight: weight, courier: kurir[i]})
        }).then(res=>res.data.rajaongkir.results[0].costs)
        
        if(ongkir_res.length) break
        i++
    }
    
    let ongkir = Math.min.apply(Math, ongkir_res.map(e=>e.cost[0].value))
    let totBayar = ongkir + totHarga
    
    res.json({ongkir , totHarga ,  totBayar})
    
})



app.get('/bayar', async(req,res)=>{
    if(req.user.address==null) return res.json({error:'Mohon isi alamat anda'})

    let medBayar = Object.values(req.query)
    let validation = {
        store : ['Indomaret' , 'Alfamart'],
        'virtual-acc' : ['BRI' , 'BNI', 'BCA', 'Mandiri'],
    }
    if(!Object.keys(validation).includes(medBayar[0]) || !validation[medBayar[0]].includes(medBayar[1]) ) return res.json({error:'metode pembayaran tidak valid'})
    
    let total = (await sumcart(req)).totHarga
    let method = (medBayar[0]=='virtual-acc')? 'Virtual Account ' + medBayar[1] : medBayar[1]
    let payment_code = randomstring.generate({length: 16 ,charset: 'numeric'})
    let id = randomstring.generate({length: 10, charset: 'numeric'});
    let deadline = Date.now()+172800000
    let user = req.user.id
    let from = JSON.parse(req.user.address).cityID_RO


    await Order.create({id, method, total , deadline , payment_code ,user , from})

    let userData =  await Users.findOne({attributes:['id', 'cartList' , 'purchasedList'] ,where: { id : req.user.id }});
    userData.cartList = {}
    console.log(userData)

    let purchasedList = JSON.parse(userData.purchasedList) || []
    purchasedList.push({id , status :false})

    userData.purchasedList = purchasedList
    userData.save()
    res.cookie('bayar',id,{maxAge:300000})

    res.contentType('application/json');
    var data = JSON.stringify('/order/succes/'+id)
    res.header('Content-Length', data.length);
    res.end(data);
})

app.get('/order/succes/:id',async(req,res)=>{
    let myPurchasedList = Object.values(JSON.parse(req.user.purchasedList).map(e=>e.id))
    let id = req.params.id
    if(!myPurchasedList.includes(id) || !req.cookies['bayar']) return res.status(404).send('Not found');
    console.log(req.cookies['bayar'])
    
    if(req.cookies['bayar'] !== id ) return res.status(404).send('Not found');



    let data = await Order.findOne({where:{id:req.params.id}})

    console.log(data)


    res.render('bayar' , {data})
})

app.get('/cartlist',async(req,res)=>{
    let cart = ((req.isAuthenticated())? JSON.parse(req.user.cartList) : req.cookies['cartLocal']) ||{}
    
    let whereQuery = []
    for (let key of Object.keys(cart)){
        whereQuery.push({id:key})
    }

    let data = await Products.findAll({
        attributes:['id','productName', 'image', 'price','stock','units'],
        where: {
            [Op.or]: whereQuery
      }
    })
    data = setOnCart(req,data)

    let totHarga = await sumcart(req) 

    res.json({data , totHarga})
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

    let sc = await sumcart(req , cart)
    
    res.json({totHarga:sc.totHarga , count:sc.count})
})

app.get('/detail', async(req,res)=>{
    let data =  await Products.findAll({ where: { id : req.query.id }})
    data = setOnCart(req,data)
    res.json(data[0])
})

async function begin(req){
    let username = (req.isAuthenticated())? req.user.name : 'login'

    let sc = await sumcart(req)


    let totHarga = (sc.totHarga==0)? '' : new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"})
         .format(sc.totHarga)
         .replace('IRD','Rp.')
         .replace(',00','')

    let count = (sc.count==0)? '' : sc.count


    let sortInputList = {'price-asc':'Harga Terendah','price-desc':'Harga Tertinggi','abjad-asc':'A - Z','abjad-desc':'Z - A'}

    let sortInput = (req.query.sortby)? sortInputList[req.query.sortby] : 'Paling sesuai'


    return{ username , totHarga , count, sortInput}
}





async function sumcart(req , data=null){

    let cart = ((req.isAuthenticated())? JSON.parse(req.user.cartList) : req.cookies['cartLocal']) || {}
    if(data) cart = data
  
    console.log('cart',cart)
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

    let oncart = ((req.isAuthenticated())? JSON.parse(req.user.cartList) : req.cookies['cartLocal']) ||{}

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

app.post('/setaddress', async (req,res)=>{
    let {name,hp,provinsi,kabupaten,kecamatan,kelurahan,jalan,postal_code} = req.body

    let url = [ 'provinsi/', 'kota/', 'kecamatan/', 'kelurahan/']
    ll = [provinsi,kabupaten,kecamatan,kelurahan]

    let strAddress = []
    for(let i=0;i<4;i++){
        let ft = await  axios({
            method: 'GET',
            url: `https://dev.farizdotid.com/api/daerahindonesia/${url[i]}${ll[i]}`,
            }).then(res=>res.data.nama)
        strAddress.unshift(ft)
    }
    strAddress= `${name} (${hp}) | ${jalan}, ${strAddress.join(', ')} (${postal_code})`
    let cityID_RO = await getCityID_RO(kabupaten)

    let update  = await Users.update({ address: {name,hp,provinsi,kabupaten,kecamatan,kelurahan,jalan,strAddress, postal_code , cityID_RO} }, {
        where: { id : req.user.id }
    });
    
    (update[0])? res.json({status:'success',strAddress}) : res.redirect('/')
})

// ongkir(1901)

async function getCityID_RO(id){

    let namaKab = await  axios({
        method: 'GET',
        url: `https://dev.farizdotid.com/api/daerahindonesia/kota/${id}`,
        }).then(res=>res.data.nama)
        

   
    let allKab = await  axios({
        method: 'GET',
        url: `https://api.rajaongkir.com/starter/city`,
        headers: {key: '2dcea8f7f70b198105982c307cbcdd7b'}
        }).then(res=> res.data.rajaongkir.results);
        
    allKab = allKab.map(e=>{
        return {id : e.city_id, name : e.type+' '+e.city_name}
    })


    
    let objKab_id = {}
    
    allKab.forEach(e=>{
        let arr = Object.values(e)
        objKab_id[arr[1]]=arr[0]
    })

    
    let sim = stringSimilarity.findBestMatch(namaKab, allKab.map(e=>e.name)).bestMatch.target


    let kab_id  = objKab_id[sim]

    return kab_id
}






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