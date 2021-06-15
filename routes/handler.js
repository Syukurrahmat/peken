const {begin , sumcart , setOnCart , getCityID_RO , getongkir} = require('./function')
const {Products,sequelize, Users ,Order} = require('../config/db')
const axios = require('axios');
const { Op, or, where } = require("sequelize");
const randomstring = require("randomstring");


module.exports = (app)=>{

    app.post('/cart',async (req,res)=>{
        
        let stock = await Products.findOne({where:{id:req.body.id},attributes:['stock']})
        if(stock.stock == 0) return
        
        let cart;

        if(!req.isAuthenticated()){
            cart = req.cookies['cartLocal'] || {}
            cart[req.body.id] = req.body.total

            for (let key of Object.keys(cart)) if(cart[key]=='0') delete cart[key]
            res.cookie('cartLocal', cart ,{ maxAge: 30*24*60*60*1000 ,httpOnly:true })
        }else{
            
            let data =  await Users.findOne({ attributes:['id','cartList'], where: { id : req.user.id }})
            
            if(!data.cartList) data.cartList = {}

            data.cartList = {...data.cartList , [req.body.id]:req.body.total}

            for (let key of Object.keys(data.cartList)) if(data.cartList[key]=='0') delete data.cartList[key]
            
            await data.save()
            cart = data.cartList
        }
    
        let sc = await sumcart(req , res,cart)
        
        res.json({totHarga:sc.totHarga , count:sc.count})
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
    app.get('/getOngkir',async(req,res)=>{
        res.json(await getongkir(req))        
    })

    app.get('/bayar', async(req,res)=>{
        if(req.user.address==null) return res.json({error:'Mohon isi alamat anda'})

        let medBayar = Object.values(req.query)
        let validation = {
            store : ['Indomaret' , 'Alfamart'],
            'virtual-acc' : ['BRI' , 'BNI', 'BCA', 'Mandiri'],
        }
        if(!Object.keys(validation).includes(medBayar[0]) || !validation[medBayar[0]].includes(medBayar[1]) ) return res.json({error:'metode pembayaran tidak valid'})
        
        let bayar = await getongkir(req)
        let method = (medBayar[0]=='virtual-acc')? 'Virtual Account ' + medBayar[1] : medBayar[1]
        let payment_code = randomstring.generate({length: 16 ,charset: 'numeric'})
        let id = randomstring.generate({length: 10, charset: 'numeric'});
        let deadline = Date.now()+172800000
        let user = req.user.id
        let address = req.user.address
        let list = req.user.cartList

        let stockBarang = await Products.findAll({
            attributes:['id','stock','sold'],
            where: {id :{[Op.or] : Object.keys(list)}},
        })
        stockBarang.forEach(async(e)=>{
            e.sold = e.sold + list[e.id]
            e.stock = e.stock - list[e.id]
            await e.save()
        })

        await Order.create({id, method, bayar , deadline , payment_code ,user , address , list ,status : 'yet'})

        let userData =  await Users.findOne({attributes:['id', 'cartList' , 'purchasedList'] ,where: { id : req.user.id }});
        
        userData.cartList = null
        
        if(!userData.purchasedList) userData.purchasedList = []
        
        userData.purchasedList = [...userData.purchasedList, id]
        
        await userData.save()

        res.cookie('bayar',id,{maxAge:300000})

        res.contentType('application/json');
        var data = JSON.stringify('/order/succes/'+id)
        res.header('Content-Length', data.length);
        res.end(data);
    })


}