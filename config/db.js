const { raw } = require('express');
const { Sequelize, DataTypes } = require('sequelize');

// let shema = 'peken'
// let username  = 'root'
// let password = ''
// let host = 'localhost'
let shema = 'heroku_475b4e555ae400e'
let username  = 'b01b5fa34784f1'
let password = '39feac2a'
let host = 'us-cdbr-east-03.cleardb.com'

const sequelize = new Sequelize(shema, username, password, {
    host: host,
    dialect:'mysql',
    logging: false,
    // query:raw,
    
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
   email : {type: DataTypes.STRING},
   cartList : {type: DataTypes.JSON},
   wishList : {type: DataTypes.JSON},
   purchasedList : {type: DataTypes.JSON},
   
}, {
    freezeTableName: true
});

module.exports = {Products,sequelize,Users} ;


