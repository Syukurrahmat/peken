const { Sequelize, DataTypes } = require('sequelize');

// let shema = 'peken'
// let username  = 'root'
// let password = ''
// let host = 'localhost'
let shema = 'freedbtech_peken'
let username  = 'freedbtech_Syukur'
let password = 'rVbBxcM!WjPj29@'
let host = 'freedb.tech'

const sequelize = new Sequelize(shema, username, password, {
    host: host,
    dialect:'mysql',
    logging: false,
    // query:raw,
    
});



const Users = sequelize.define('users', {
    id : {type: DataTypes.STRING , primaryKey:true},
    name : {type: DataTypes.STRING},
    username : {type: DataTypes.STRING},
    email : {type: DataTypes.STRING},
    cartList : {type: DataTypes.JSON},
    purchasedList : {type: DataTypes.JSON},
    address : {type:DataTypes.JSON}
    
}, {
    freezeTableName: true
});



ff()

async function ff(){
    let data = await Users.findOne({where:{id : '106198548496909630299' }})

    console.log(data.cartList)
    
    if(!data.cartList) data.cartList = {}

    // data.cartList[23] = 2
    pro = 22
    val = 1
    
    // console.log(cart)

    // ll = cart

    // console
    data.cartList = {...data.cartList , [pro]:val  }
    data.save()
    
    console.log(data.cartList)
    // console.log(data.name)

}