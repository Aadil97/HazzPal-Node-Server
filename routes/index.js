var express = require('express');
var router = express.Router();
var fs = require('fs');
var config = require('../config');
var clockwork = require('../node_modules/clockwork')({key:config.apiKey});
var https = require('https');
var results = require('./results.json');
var endData;
var numbers = require('./numbers.json');

//Mongodb
const MongoClient = require('mongodb').MongoClient;

// replace the uri string with your connection string.
const uri = config.mongoDBconnect
MongoClient.connect(uri, function(err, client) {
   if(err) {
        console.log('Error occurred while connecting to MongoDB Atlas...\n',err);
   }
   console.log('Connected...');
   const collection = client.db("test").collection("devices");
   // perform actions on the collection object
   client.close();
});

//Mainpage to test if it works
router.get('/', function(req,res,next){
  res.render('index', {})

});

//Sends everyone (on the numbers.json file) the sunset and sunrise times
router.get('/sunset', (req, res) => {
  //Grabs sunrise and sunset data from an API
  https.get('https://api.sunrise-sunset.org/json?lat=36.7201600&lng=-4.4203400&date=today',(resp)=>{
    let data = '';
    resp.on('data',(chunk)=>{
      data += chunk;
    });
    resp.on('end', () => {
      //Translate it to a javascript object
      endData = JSON.parse(data);
      console.log('endData:'+endData);
      var listofNos = numbers;
      //Clockwork function at the bottom of this script
      clockworkAPI(endData,listofNos);
      res.send({
        message: 'message sent'
      });
    });
  })
})

//Add a number to numbers.json to be gived updated times of sunrise and sunset
router.get('/recordnumber', (req, res) => {
  var file = './numbers.json';
  fs.writeFileSync(file, req.query.from);
  numbers.push(req.query.from);
  console.log(req.query.from);
  console.log();
   
res.send({
  message: 'Your phone number is '+req.query.from
})
})

function clockworkAPI(endData, listofNos){
  var fullListOfNos = [];
  for(var i=0;i<listofNos.length;i++){
    fullListOfNos[i] = { To: listofNos[i], Content: 'Sunset is at '+endData.results.sunset+' and Sunrise is at '+endData.results.sunrise }
  }
  console.log(fullListOfNos);
  clockwork.sendSms([fullListOfNos], 
  function(error, resp) {
    if (error) {
        console.log('Something went wrong', error);
    } else {
        console.log('Message sent',resp.responses[0].id,endData.results.sunset,endData.results.sunrise,listofNos);
    }
});
}

module.exports = router;
