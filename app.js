let express = require('express');

let svgCaptcha = require('svg-captcha');

let path = require('path');

let session = require('express-session');

let bodyParser = require('body-parser');

let app = express();

let MongoClient = require('mongodb').MongoClient;

app.use(express.static('static'));

app.use(session({
    secret: 'keyboard cat',
}))

app.use(bodyParser.urlencoded({ extended: false }))

app.get('/login',(req,res)=>{
    res.sendFile(path.join(__dirname,'static/views/login.html'));
})

//验证码请求
app.get('/login/captchaIma',(req,res)=>{
    var captcha = svgCaptcha.create();
    req.session.code = captcha.text;;
    res.type('svg');
    res.status(200).send(captcha.data);
})

// 验证登陆
app.post('/login',(req,res)=>{
    let userName = req.body.userName;
    let userPass = req.body.userPass;
    if (req.body.code==req.session.code) {
        const url = 'mongodb://localhost:27017';
        const dbName = 'test';
        MongoClient.connect(url, function(err, client) {
            const db = client.db(dbName);
            const collection = db.collection('userInfo');
            collection.find({
                userName,
                userPass
            }).toArray(function(err, docs) {
                if(err) console.log(err);
                if (docs.length!=0) {
                    req.session.userInfo = {userName,userPass};
                    res.redirect('/index');
                }else{
                    res.send(`<script>alert("用户名密码不正确");window.location="/login"</script>`);
                }
            });
        });
    }else {
        res.send(`<script>alert('验证码错误');window.location="/login"</script>`);
    }
})

// 首页
app.get('/index',(req,res)=>{
    if (req.session.userInfo) {
        res.sendFile(path.join(__dirname,'static/views/index.html'));
    }else{
        res.redirect('/login');
    }
})

// 请求注册页
app.get('/register',(req,res)=>{
    res.sendFile(path.join(__dirname,'static/views/register.html'));
})

// 注册页
app.post('/register',(req,res)=>{

    let userName = req.body.userName;

    let userPass = req.body.userPass;
    
    const url = 'mongodb://localhost:27017';
 
    // Database Name
    const dbName = 'test';
    
    // Use connect method to connect to the server
    MongoClient.connect(url, function(err, client) {
        const db = client.db(dbName);

        const collection = db.collection('userInfo');
        collection.find({userName:userName}).toArray(function(err, docs) {
            if (docs.length==0) {
                collection.insertOne({
                    userName,
                    userPass
                },(err,results)=>{
                    if(err) console.log(err);
                    res.send(`<script>alert('注册成功');window.location="/login"</script>`)
                })
            }else{
                res.send(`<script>alert('已被注册');window.location="/register";</script>`)
            }
        });
    });
})

// 登出
app.get('/logout',(req,res)=>{
    delete req.session.userInfo;
    res.redirect('/login');
})

app.listen(80,'127.0.0.1',()=>{
    console.log('success');
})