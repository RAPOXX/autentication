const mysql = require('mysql')
require('dotenv').config()

const database = mysql.createConnection({
    host : process.env.DATABASE_HOST,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PASSWORD,
    database : 'cadastro'
})

database.connect((err) => {
    if(err) {
        console.log(err)
    }else {
        console.log('conectado ao banco de dados com sucesso')
    }
})

module.exports = database