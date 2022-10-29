require('dotenv').config()

const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {LocalStorage} = require('node-localstorage')
const localStorage = new LocalStorage('./scratch')
const fs = require('fs')

const app = express()
const porta = process.env.PORTA_SERVER
const database = require('./database')

//configuracao do bodyparser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : false}))

app.use(express.static(__dirname + '/static'))

//a cada requisiçao feita soma +1 no arquivo requisicoes.txt
app.use((req,res,next) => {
    const filePath = path.join(__dirname + '/static/requisicoes.txt')
    const contentArquivo = fsreadFileSync(filePath,'utf-8')
    fs.writeFileSync(filePath,parseInt(contentArquivo) + 1)
    next()
})

app.get('/',(req,res) => {
    res.status(200).redirect('/login')
})

//responde com o html de login
app.get('/login',(req,res)  => {
    res.status(200).sendFile(path.join(__dirname +'/static/login.html'))
})


//responde com o html de cadastro
app.get('/cadastro',(req,res) => {
    res.status(200).sendFile(path.join(__dirname + '/static/cadastro.html'))
})

//encriptografa a senha
//insere o  email e a senha criptografada no banco de dados
app.post('/cadastrar',(req,res) => {
    const email = req.body.email
    const password = req.body.password
    const passCript = bcrypt.hashSync(password,10)
    database.query(`INSERT INTO usuarios(email,senha) VALUES('${email}','${passCript}')`,(err) => {
        if(err) {
            console.log(err)
        }else {
            console.log('USUARIO INSERIDO NO BANCO DE DADOS')
        }

    })
    res.end()
})

app.get('/private',(req,res) => {
    try {
    const auth = localStorage.getItem("autentication")
    const authVerify = jwt.verify(auth,'secret')
        res.send(authVerify.email)
    }
    catch {
        res.redirect('/login')
    }
    res.end()
})

//Autenticaçao do usuario
app.post('/logar',(req,res) => {
    const email = req.body.email
    const password = req.body.password
    //verifica se o email esta no banco de dados
    database.query(`SELECT email FROM usuarios WHERE email = '${email}'`,(err,result) => {
        if(result == '') {
            console.log('dados incorretos')
        }else {
            //verifica a senha do usuario com a senha criptografada do banco de dados
            database.query(`SELECT senha FROM usuarios WHERE email = '${email}'`,(err,result) => {
                const passCorrect = result[0].senha
                bcrypt.compare(password,passCorrect,(err,bool) => {
                   if(err) {
                        console.log(err)
                    }else {
                        if(bool) {
                            const token = jwt.sign(
                            {
                                email : email
                            },'secret',
                            {
                                expiresIn : '1m'                             
                            })
                            localStorage.setItem("autentication",token)
                            res.redirect('/private')
                        }else {
                            console.log('dados incorretos')
                        }
                    }
                })
            })
        }
    })
})

app.get('/requisicoes',(req,res) => {
    const filePath = path.join(__dirname + '/static/requisicoes.txt')
    const contentArquivo = fs.readFileSync(filePath,'utf-8')
    res.json({requisicoes : contentArquivo})
})

app.listen(porta,() => {
    console.log('servidor rodando')
})