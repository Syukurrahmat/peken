const {begin , sumcart , setOnCart,checkreferrer} = require('./function')
const {Products,sequelize, Users ,Order} = require('../config/db')
const { Op, or, where } = require("sequelize");
const axios = require('axios');


module.exports = (app)=>{
    app.get('/detail', checkreferrer, async(req,res)=>{
        let data =  await Products.findAll({ where: { id : req.query.id }})
        data = setOnCart(req,data)
        res.json(data[0])
    })
    
    app.get('/topProduct',checkreferrer, async (req,res)=>{
        let data =  await Products.findAll({
           attribute0s:['id', 'productName', 'image', 'note', 'price','stock'],
           where:{
                [Op.and] :[
                    {top:true},
                    {stock :{[Op.ne]: 0}}
                ]   
            },
           order: sequelize.random(),
           limit: 5
        }); 
        
        data = setOnCart(req,data)
        res.json({data})
    })
    
    app.get('/getProduct',checkreferrer, async (req,res)=>{
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
    
        let orderQuery = (orderConcat == 'none NONE')? sequelize.literal('stock > 0 DESC ,rand(159)') : sequelize.literal(orderConcat)
    
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
    
    app.get('/relateProduct',checkreferrer, async(req,res)=>{
        let id = req.query.id
        let name =  await Products.findOne({attributes:['productName'], where: {id}})
        let similar = name.productName.split(' ').filter(e=>e.length>3 && (e !=='sisir' && e !== 'pack') )
        
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
            order:sequelize.literal('stock > 0 DESC'),
            limit: 5,
        }); 
        data = setOnCart(req,data)
        res.json({data})
    })
    app.get('/cartlist',checkreferrer,async(req,res)=>{
        let cart = ((req.isAuthenticated())? req.user.cartList : req.cookies['cartLocal']) ||{}
        
        let data = await Products.findAll({
            attributes:['id','productName', 'image', 'price','stock','units'],
            where: {id :{[Op.or] : Object.keys(cart)}},
        })
        data = setOnCart(req,data)
    
        let totHarga = await sumcart(req) 
    
        res.json({data , totHarga})
    })

    app.get('/getorders',checkreferrer,async(req,res)=>{
        let data = await Order.findAll({
            where: {user : req.user.id},
            attributes :['id', 'method', 'bayar' , 'deadline' , 'payment_code' , 'status' , 'createdAt'],
        })

        data.forEach(async(e)=>{
            if(Date.now() - e.deadline > 0 ){
                e.status = 'expired'
                await e.save()
            }
        })

        res.json(data)
    })

    app.get('/getdetailorder:id',checkreferrer,async(req,res)=>{
        let data = await Order.findOne({
            where: {id : req.params.id },
            raw : true
        })

        let listBarang =  await Products.findAll({
            attributes:['id','productName', 'image', 'price'],
            where: {id :{[Op.or] : Object.keys(data.list)}},
            raw : true
         }); 
        res.json({...data , listBarang})
    })
}