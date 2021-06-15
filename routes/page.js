const {begin , sumcart , toFullTanggal, num2rupiah } = require('./function')
const {Products,sequelize, Users ,Order} = require('../config/db')
const {isLoggedIn, isLoggedOut} = require('../config/passport');

module.exports = (app)=>{
    app.get('/', async(req,res)=>{
        res.render('home', await begin(req,res) )
    })

    app.get('/search', async(req,res)=>{
        let key = req.query.key
        if(key==undefined) return res.redirect('/')

        res.render('search',{ ...await begin(req,res), key})
    })

    app.get('/d/product-:id',async (req,res)=>{
        let data =  await Products.findOne({ where: { id : req.params.id }})
        if(!data) res.redirect('/')

        res.render('detail',await begin(req,res))
    })

    app.get('/g/:any', async(req,res)=>{
        let validation = {'buah':'Buah' ,'sayur':'Sayur', 'all':'Semua' }
        let key = validation[req.params.any]
        if(key===undefined) return res.status(404).send('Not found');

        res.render('product',{...await begin(req,res), ...{key}})
    })

    app.get('/cart',isLoggedIn,(req,res)=>{
        res.render('cart',{username:(req.isAuthenticated())? req.user.username : 'Login'})
    })

    app.get('/checkout',isLoggedIn, async (req,res)=>{
        if( !req.headers.referer || new URL(req.headers.referer).pathname != '/cart' ) return res.redirect('/cart')

        res.render('checkout',{
            username:(req.isAuthenticated())? req.user.username : 'Login',
            address : (req.user.address)? req.user.address.strAddress : 'tidak ada alamat tersimpan'
        })
    })
    app.get('/order',isLoggedIn,async(req,res)=>{
        res.render('order',{...await begin(req,res)})
    })
  
    app.get('/order/succes/:id',isLoggedIn,async(req,res)=>{
        let id = req.params.id
        if(!req.user.purchasedList.includes(id) || !req.cookies['bayar']) return res.status(404).send('Not found');
        
        if(req.cookies['bayar'] !== id ) return res.status(404).send('Not found');

        let data = await Order.findOne({where:{id:req.params.id}})
        let deadline = toFullTanggal(data.deadline)
        let bayar  = num2rupiah(data.bayar.totBayar)

        res.render('bayar' , {data , deadline , bayar})
    })
}