const express= require('express');
const app= express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const url = require('url');
const querystring = require('querystring'); 
const mysql = require('mysql');
const admin = require('firebase-admin');

var FCM = require('fcm-push');

var serverKey = 'AAAASgtMh-o:APA91bHlJlpKoH6Kk_hU4lWcMBOSYGwpg9fAQc1sT9KEZuTv6HeF6oaYGurT8yLzNqxAa30AP4NnLRWccYYshyU4OBFhpBx5USGMlKg0VYzzHXKnAwWAtMCddpMEWu0vAlVwgiaphzuOC3tBSXUAoGZduA6IMqIsug';
var fcm = new FCM(serverKey);

var con = mysql.createPool({
    connectionLimit : 10,
    host: 'qrcodescanner.coqa2ghc5ipd.us-east-2.rds.amazonaws.com',
    user: 'qrcodescanner',
    password: 'qrcodescanner',
    database: 'QRcodeScanner', 
    port: 3306,
    debug: true,
    connectTimeout: 30000,
    acquireTimeout: 30000
});

exports.handler = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    con.connect(function(err){
    
        if(!err) {
            callback(null, "abc");
            console.log("Database is connected ... nn");    
        } else {
            callback(err);
            console.log("Error connecting database ... nn"); 
            console.log(err);
        }
            con.end();
        });
};



app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.listen(PORT, function (err) {
    if (err) {
        console.log("error" + err);
    }
    else {
        console.log("listening");
    }
})

function handle_database(query,req,res) {
    
    pool.getConnection(function(err,connection){
        if (err) {
          res.json({"code" : 100, "status" : "Error in connection database"});
          return;
        }   

        console.log('connected as id ' + connection.threadId);
        
        connection.query(query,function(err,rows){
            connection.release();
            if(!err) {
                res.json(rows);
            }           
        });

        connection.on('error', function(err) {      
              res.json({"code" : 100, "status" : "Error in connection database"});
              return;     
        });
  });
}

app.get('/handle', function(req,res){
    var query = "select * from category_detail";
    handle_database(query, req, res);
});

app.get('/h', function(req,res){
    console.log("abc");
});

app.get('/getValidityofQrcode', function (req, res) {
    var query = "select count(product_qr_code_id) AS total from QRcodeScanner.product_info where product_qr_code=" + mysql.escape(req.query._product_qr_code);
    //var query2 = "Insert into user_info(name,phone_no,token,email) values(" + req.body.mac_address + "," + req.body.qrcode + ")";
    con.getConnection(function (err, connection) {
        if (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        }

        console.log('connected as id ' + connection.threadId);

        connection.query(query, function (err, result) {
            //connection.release();
            res.json(result);
        });

        connection.on('error', function (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        });
    });
});

app.get('/postMacAddressAndQrcode', function (req, res) {
    var query = "Insert into QRcodeScanner.user_info(macAddress, _product_qr_code) values(" + mysql.escape(req.query.macAddress)+"," + mysql.escape(req.query._product_qr_code) + ")";
    //var query = "Insert into QRcodeScanner.user_info(macAddress, date, _product_qr_code) values(" + mysql.escape(req.query.macAddress) + "," + mysql.escape(req.query.date) + "," + mysql.escape(req.query._product_qr_code) + ")";
    con.getConnection(function (err, connection) {
        if (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        }

        console.log('connected as id ' + connection.threadId);

        connection.query(query, function (err, result) {
            //connection.release();
            if(!err){
                console.log("inserted");
            }
        });

        connection.on('error', function (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        });
    });
});
//Added Post qr code data for admin by kashif zahid
 app.post('/postQrCode', function (req, res) {
     //var obj = JSON.parse(req.body);
     //console.log(obj);
    // console.log(obj.info.length+"----------------------------------------------------------------------------");

        for (var i = 0; i < req.body.QrData.length; i++) {


            var postQrCodequery = "Insert into product_info(product_qr_code_id) values(" + req.body.QrData[i].qrcode + ")";
            con.getConnection(function (err, connection) {


                console.log('connected as id ' + connection.threadId);

                connection.query(postQrCodequery, function (err, result) {
                    //connection.release();
                    if (!err) {


                    }

                });

                connection.on('error', function (err) {
                    res.json({ "code": 100, "status": "Error in connection database" });
                    return;
                });
            });
        }
})

//edited by kashif



app.post('/getDistintMacaddressCount', function (req, res) {
    var query2 = "select count(distinct macAddress) AS total from QRcodeScanner.user_info where _product_qr_code = "+ mysql.escape(req.body.qrcode);
    con.getConnection(function (err, connection) {
        if (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        }

        console.log('connected as id ' + connection.threadId);

        connection.query(query2, function (err, result) {
            //connection.release();
               res.json(result);
        });

        connection.on('error', function (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        });
    });
});
