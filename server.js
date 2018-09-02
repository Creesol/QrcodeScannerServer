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

var pool = mysql.createPool({
    host: 'qrcodescanner.coqa2ghc5ipd.us-east-2.rds.amazonaws.com',
    user: 'qrcodescanner',
    password: 'qrcodescanner',
    database: '', 
    port: 3306,
    debug: true,
    connectTimeout: 30000,
    acquireTimeout: 30000
});
/*
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
*/
exports.handler =  (event, context, callback) => {
    //prevent timeout from waiting event loop
    context.callbackWaitsForEmptyEventLoop = false;
    var items = "select * from category_detail" ;

    con.query(items, function (err, result) {
        console.log("runnning");
        if (err) {
            console.log(err);
            res.end();
        }
        console.log(result);
        console.log(result[0].item_id);
        
        //res.send([{ "name": result[0].item_name, "image": result[0].itemname, "quantity": "1", "description": result[0].description, "price": result[0].updated_price, "measuring_unit": result[0].measuringunit }, { "name": 1, "image": "R.drawable.milk__", "quantity": "1", "description": "any thing", "price": "120", "measuring_unit": "litre" }, { "name": 1, "image": "R.drawable.milk__", "quantity": "1", "description": "any thing", "price": "120", "measuring_unit": "litre" }, { "name": 1, "image": "R.drawable.milk__", "quantity": "1", "description": "any thing", "price": "120", "measuring_unit": "litre" }, { "name": 1, "image": "R.drawable.milk__", "quantity": "1", "description": "any thing", "price": "120", "measuring_unit": "litre" }]);
        res.send(result);
        
    })
    
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

app.post('/getValidityofQrcode', function (req, res) {
    var query = "select count(product_qr_code_id) AS total from product_info where product_qr_code=" + mysql.escape(req.body.qrcode);
    var query2 = "Insert into user_info(name,phone_no,token,email) values(" + req.body.mac_address + "," + req.body.qrcode + ")";
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

app.post('/postMacAddressAndQrcode', function (req, res) {
    var query = "Insert into user_info(name,phone_no,token,email) values(" + req.body.mac_address + "," + req.body.qrcode + ")";
    con.getConnection(function (err, connection) {
        if (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        }

        console.log('connected as id ' + connection.threadId);

        connection.query(query, function (err, result) {
            //connection.release();
            if(!err){
                
            }
        });

        connection.on('error', function (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        });
    });
});

app.post('/getDistintMacaddressCount', function (req, res) {
    var query2 = "select count(distinct macAddress) AS total from QRcodeScanner.user_info where _product_qr_code = "+ mysql.escape(req.body.qrcode);
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
