const {Products,sequelize, Users ,Order} = require('../config/db')
const { Op, or, where } = require("sequelize");
const axios = require('axios');
const stringSimilarity = require("string-similarity");
const qs = require("querystring");

async function begin(req,res){
    let username = (req.isAuthenticated())? req.user.username : 'Login'
    let name = (req.isAuthenticated())? req.user.name : ''

    let sc = await sumcart(req,res)

    let totHarga = (sc.totHarga==0)? '' : new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"})
         .format(sc.totHarga)
         .replace('IRD','Rp.')
         .replace(',00','')

    let count = (sc.count==0)? '' : sc.count

    let sortInputList = {'price-asc':'Harga Terendah','price-desc':'Harga Tertinggi','abjad-asc':'A - Z','abjad-desc':'Z - A'}
    let sortInput = (req.query.sortby)? sortInputList[req.query.sortby] : 'Paling sesuai'

    return{ username ,name, totHarga , count, sortInput}
}

async function sumcart(req ,res=null, data=null){
    let cart = ((req.isAuthenticated())? req.user.cartList : req.cookies['cartLocal']) || {}
    if(req.isAuthenticated() &&  req.cookies['cartLocal']!==undefined){
        let data =  await Users.findOne({ attributes:['id','cartList'], where: { id : req.user.id }})
        if(!data.cartList) data.cartList = {}
        data.cartList = {...data.cartList , ...req.cookies['cartLocal']}
        for (let key of Object.keys(data.cartList)) if(data.cartList[key]=='0') delete data.cartList[key]
        await data.save()
        cart = data.cartList
        res.clearCookie("cartLocal");
    }
    if(data) cart = data
    
    let harga = await Products.findAll({ attributes:['id','price'],where: {id :{[Op.or] : Object.keys(cart)}}})
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

function setOnCart(req,data){
    let iddata = data.map(e=>e.id)
    let oncart = ((req.isAuthenticated())? req.user.cartList : req.cookies['cartLocal']) ||{}

    for (let key of Object.keys(oncart)){
        let ind = iddata.indexOf(Number(key))
        if(ind!=-1){
            data[ind].dataValues['oncart'] = oncart[key]
        }
    }
    return data
}

async function getongkir(req,res){
    let totHarga = (await sumcart(req)).totHarga
    if(req.user.address==null) return res.json({error:'Alamat belum ditetapkan' , totHarga})
    
    let destination = String(req.user.address.cityID_RO)
    
    let estimatedWeight = {
        kg : 1000,
        pcs : 250,
        pack : 500,
        sisir : 950, 
    }
    let cart = req.user.cartList
    let units = await Products.findAll({ attributes:['id','units'] ,where : {id :{[Op.or] : Object.keys(cart)}}})
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
    
    return {ongkir , totHarga ,  totBayar}
}

async function getCityID_RO(id){
    let data = await axios.all([
        axios(`https://dev.farizdotid.com/api/daerahindonesia/kota/${id}`),
        axios({
            method: 'GET',
            url: `https://api.rajaongkir.com/starter/city`,
            headers: {key: '2dcea8f7f70b198105982c307cbcdd7b'}
            })
        ])
    let namaKab = data[0].data.nama
    
    let allKab = data[1].data.rajaongkir.results.map(e=>{
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

function toFullTanggal(dt){
    let bulanArr = ['Januari', 'Februari', 'Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    let xbulan = new Date(dt).getMonth();
    
    let jam = String(new Date(dt).getHours()).padStart(2,0)
    let menit = String(new Date(dt).getMinutes()).padStart(2,0)
    let tanggal = new Date(dt).getDate();
    let bulan = bulanArr[xbulan];
    let tahun = new Date(dt).getFullYear();

    return (`${jam}:${menit} , ${tanggal} ${bulan} ${tahun}`);

}
function num2rupiah(number){
    return (!Number.isInteger(number))? number :  new Intl.NumberFormat("id-ID", {style: "currency", currency: "IDR"})
     .format(number)
     .replace('IRD','Rp.')
     .replace(',00','') || number
}

function checkreferrer(req,res,next){
    if( !req.headers.referer || new URL(req.headers.referer).hostname != req.hostname ) return res.redirect('/')
    return next()
}

module.exports = {begin , sumcart, getCityID_RO, setOnCart , toFullTanggal , getongkir,num2rupiah , checkreferrer }