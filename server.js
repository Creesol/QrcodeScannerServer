const express= require('express');
const app= express();
const PORT = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const url = require('url');
const querystring = require('querystring'); 
const mysql = require('mysql');
const admin = require('firebase-admin');
var fs = require('fs');
var XLSX = require('xlsx');
var upload = require('express-fileupload');
var http = require('http');
var util = require('util');

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



app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(upload());
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


app.get('/getUserByDate', function (req, res) {
    
    var day = "SELECT count(user_id) as total FROM QRcodeScanner.user_info WHERE date > DATE_SUB(NOW(), INTERVAL 1 DAY)";
    var week = "SELECT count(user_id) as total FROM QRcodeScanner.user_info WHERE date > DATE_SUB(NOW(), INTERVAL 1 WEEK)";
    var month = "SELECT count(user_id) as total FROM QRcodeScanner.user_info WHERE date > DATE_SUB(NOW(), INTERVAL 1 MONTH)";
    var allTime = "select count(_product_qr_code) as total from QRcodeScanner.user_info";
    var data=[];
    con.getConnection(function (err, connection) {
        if (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        }

        console.log('connected as id ' + connection.threadId);
        

        connection.query(day, function (err, result) {
            //connection.release();
            if(!err){
                console.log("inserted");
                data.push(result[0]);
                connection.query(week, function (err, result) {
                //connection.release();
                if(!err){
                    console.log("inserted");
                    data.push(result[0]);
                    connection.query(month, function (err, result) {
                    //connection.release();
                    if(!err){
                        console.log("inserted");
                        data.push(result[0]);
                        connection.query(allTime, function (err, result) {
                        //connection.release();
                        if(!err){
                            console.log("inserted");
                            data.push(result[0]);
                            res.json(data);
                
                
            }
        });
                
                
            }
        });
                
                
            }
        });
                
            }
        });

        connection.on('error', function (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        });
    });
});
app.get('/getTotalqr',function(req,res){
    var query="select count(product_qr_code) AS Total from QRcodeScanner.product_info";
    con.getConnection(function(err,connection){
        connection.query(query, function (err, result) {
            res.send(result);
        })
        
    })
})
app.get('/checkedMoreThenOnce', function (req, res) {

    var query = "SELECT count(distinct macAddress) as macAddr,_product_qr_code FROM QRcodeScanner.user_info group by _product_qr_code having count(macAddress)>1 order by macAddr desc";

    con.getConnection(function (err, connection) {
        connection.query(query, function (err, result) {
            connection.release();
            res.send(result);
        })

    })
})
app.get('/FakeRealStats', function (req, res) {

    var query2 = "SELECT fake,counter.real,sum(fake+counter.real) as total FROM QRcodeScanner.counter";

    con.getConnection(function (err, connection) {
        connection.query(query2, function (err, result) {
            connection.release();
            res.send(result);
        })

    })
})

app.post('/getValidityofQrcode', function (req, res) {
    
    var mac_address = req.body.macAddress;
    var product_qr_code = req.body._product_qr_code;
    var date = req.body.date;
    
    console.log(mac_address + " " + product_qr_code + " " + date);
    var fake = "UPDATE counter SET fake=fake+1 WHERE id=1";
    var real = "UPDATE counter SET counter.real=counter.real+1 WHERE id=1";
    
    var query3 = "Insert into QRcodeScanner.user_info(macAddress, _product_qr_code, date) values(" + mysql.escape(mac_address)+"," + mysql.escape(product_qr_code) + "," + mysql.escape(date) + ")";
    var query = "select count(product_qr_code_id) AS total from QRcodeScanner.product_info where product_qr_code=" + mysql.escape(product_qr_code);
    var query2 = "select count(distinct macAddress) AS total from QRcodeScanner.user_info where _product_qr_code = "+ mysql.escape(product_qr_code);
    //var query2 = "Insert into user_info(name,phone_no,token,email) values(" + req.body.mac_address + "," + req.body.qrcode + ")";
    con.getConnection(function (err, connection) {
        if (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        }

        console.log('connected as id ' + connection.threadId);

        connection.query(query, function (err, result) {
            //connection.release();
            console.log(result[0].total);
            
            
            if(result[0].total>0){
                connection.query(query2, function (err, result) {
                   
                   
                    if(result[0].total>4){
                        
                        connection.query(fake, function (err, result) {

                            res.send({ "code": 2 });


                        })
               }
                    else{
                    connection.query(query3, function (err, result) {
                       
                        
                        connection.query(real, function (err, result) {

                            res.send({ "code": 1 });


                        })
                            
                           
                            })
                        
                    }
                    
                    })
                
                
            }
            else{
                connection.query(fake, function (err, result) {

                    res.send({ "code": 2 });


                })
            }
        });
        connection.release();
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
app.post('/upload', function (req, res) {
     //var obj = JSON.parse(req.body);
    
    console.log("called");
    console.log(req.files);
    
  // var file = req.files;
    var file = req;
    
    res.send("execute");
    getData(req.files);
   

    
   // res.end();
});


function getData(file){


    if (file) {
        //console.log(req.files.bill);
        var workbook = XLSX.read(file.bill.data, { type: 'buffer' });


        var sheet_name_list = workbook.SheetNames;
        sheet_name_list.forEach(function (y) {
            var worksheet = workbook.Sheets[y];
            var headers = {};
            var data = [];
            for (z in worksheet) {
                if (z[0] === '!') continue;
                //parse out the column, row, and value
                var tt = 0;
                for (var i = 0; i < z.length; i++) {
                    if (!isNaN(z[i])) {
                        tt = i;
                        break;
                    }
                };
                //var col = z.substring(0, tt);
                var col = z.substring(0, 1);
                var row = parseInt(z.substring(tt));
                var value = worksheet[z].v;
                var value2 = "QrCode";

                //store header names
                if (row == 1 && value) {
                    if (col == "A") {
                        headers[col] = value2;
                    }
                    console.log(col);
                    
                   
                    continue;
                } 



                if (!data[row]) data[row] = {};
                data[row][headers[col]] = value;
            }
            //drop those first two rows which are empty
            data.shift();
            data.shift();
            console.log(data);
            insertData(data);
        })
        }
        }

function insertData(data){
    
    var datas=[];
            
            con.getConnection(function (err, connection) {
                 for (var i = 0; i < data.length; i++) {
                     


                console.log('connected as id ' + connection.threadId);
                     var postQrCodequery = "Insert into product_info(product_qr_code) values(" + mysql.escape(data[i].QrCode) + ")";

                connection.query(postQrCodequery, function (err, result) {
                   
                    datas.push(i);
                    if(datas.length==data.length){
                            console.log(con._freeConnections.indexOf(connection));
                            connection.release();
                            
                           // res.send([{"code":1}]);
                            console.log(con._freeConnections.indexOf(connection));
                        }
                    
                    //connection.release();
                    if (!err) {
                        
                    //data.push(result.insertedid);
                        i
                    
                    }

                });

                connection.on('error', function (err) {
                    res.json({ "code": 100, "status": "Error in connection database" });
                    return;
                });
                     }
                //res.send("done");
               
            });
}

        


//edited by kashif



app.get('/getDistintMacaddressCount', function (req, res) {
    var query2 = "select count(distinct macAddress) AS total from QRcodeScanner.user_info where _product_qr_code = "+ mysql.escape(req.query._product_qr_code);
    con.getConnection(function (err, connection) {
        if (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        }

        console.log('connected as id ' + connection.threadId);

        connection.query(query2, function (err, result) {
            //connection.release();
            console.log(result);
               res.json(result[0]);
        });

        connection.on('error', function (err) {
            res.json({ "code": 100, "status": "Error in connection database" });
            return;
        });
    });
});
