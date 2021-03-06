const { Sequelize, DataTypes } = require('sequelize');

let schema = process.env.SCHEMA
let username  = process.env.NAME
let password = process.env.PASSWORD
let host = process.env.HOST

const sequelize = new Sequelize(schema, username, password, {
    host: host,
    dialect:'mysql',
    logging: false,
});

const Products = sequelize.define('products', {
   productName : {type: DataTypes.STRING},
   farm : {type: DataTypes.STRING},
   top : {type: DataTypes.BOOLEAN},
   price : {type: DataTypes.INTEGER},
   note : {type: DataTypes.STRING},
   description : {type: DataTypes.STRING},
   category : {type: DataTypes.STRING},
   stock : {type: DataTypes.INTEGER},
   sold : {type: DataTypes.INTEGER},
   image : {type: DataTypes.JSON},
   units : {type: DataTypes.STRING},
}, {
    freezeTableName: true
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

const Order = sequelize.define('orders', {
    id : {type: DataTypes.STRING , primaryKey:true},
    method : {type: DataTypes.STRING},
    bayar : {type: DataTypes.JSON},
    deadline : {type: DataTypes.INTEGER},
    payment_code : {type: DataTypes.STRING},
    user : {type: DataTypes.STRING},
    address : {type: DataTypes.JSON},
    list : {type: DataTypes.JSON},
    status : {type : DataTypes.STRING},
    accepted : {type : DataTypes.INTEGER}
}, {
    freezeTableName: true
});

module.exports = {Products,sequelize,Users, Order} ;
