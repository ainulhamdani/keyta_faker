var express = require('express');
const axios = require("axios");
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const fs = require('fs-extra')
var router = express.Router();

const adapter = new FileSync('db.json')
let db = low(adapter)
db.defaults({ configs: {
  "token" : "",
  "base_url" : "https://live.keyta.id/api/",
  "faker_url" : "https://faker.ainulhamdani.com/",
  "base_price" : 250000,
  "price_random" : 100,
  "delay" : 0
} }).write()
let globalConfig = db.get('configs').value();

var start = false
var lastData = {}
var lastDelay = 0
var lastTimeProcess = 0


  
axios.defaults.baseURL = globalConfig.base_url
axios.defaults.headers.common = {'Authorization': `Bearer ${globalConfig.token}`}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.send("")
});

router.get('/start', function(req, res, next) {
  if(start) {
    res.json({status:"success", message:"Process already started"})
  } else {
    start = true
    createTransactionsProcess()
    res.json({status:"success", message:"Request to start process"})
  }
});

router.get('/stop', function(req, res, next) {
  if(!start) {
    res.json({status:"success", message:"Process already stopped"})
  } else {
    start = false
    res.json({status:"success", message:"Request to stop process"})
  }
  
});

router.get('/add', function(req, res, next) {
  getFakerData(1).then((response) => {
    // console.log(response)
    createTransactions(response).then(() => {
      console.log("all transaction created")
    })
    res.send(response)
  })
});

router.get('/add/:num', function(req, res, next) {
  getFakerData(req.params.num).then((response) => {
    // console.log(response)
    createTransactions(response).then(() => {
      console.log("all transaction created")
    })
    res.send(response)
  })
});

router.post('/config', function(req, res, next) {
  let data = req.body
  let config = db.get('configs').value();
  config.token = data.token
  config.base_url = data.base_url
  config.faker_url = data.faker_url
  config.base_price = data.base_price
  config.price_random = data.price_random
  config.delay = data.delay
  globalConfig = config
  
  axios.defaults.baseURL = globalConfig.base_url
  axios.defaults.headers.common = {'Authorization': `Bearer ${globalConfig.token}`}

  db.get('configs').assign(config).write()
  res.json({status:"success"})
});

router.get('/config', function(req, res, next) {
  res.json(globalConfig)
});

router.get('/status', function(req, res, next) {
  let status = {}
  status.start = start
  status.last_data = lastData
  status.last_delay = lastDelay
  status.last_process_time = lastTimeProcess
  status.next_time_process = lastTimeProcess + lastDelay*1000
  res.json(status)
});

async function createTransactions(response) {
  let i = 1
  let price = globalConfig.base_price
  response.forEach(person => {
    sleep(i*1000).then(() => {
      let random = Math.ceil(Math.random() * globalConfig.price_random * 1000)
      let data = {}
      let x = i;
      data.height = 20
      data.length = 20
      data.width = 10
      data.weight = 1
      data.total_price = price + random
      data.shipping_price = 0
      data.expedition_attributes = {}
      data.expedition_attributes.name = "Kurir Pribadi"
      data.expedition_attributes.code = "pribadi"
      data.expedition_attributes.expedition_id = 20
      data.expedition_attributes.expedition_service_type = "Pribadi"
      data.customer_attributes = person
      console.log("createTransactionData "+x+" : " + person.customer_name)
      createTransactionData(data).then((res) => {
        console.log(res.data.id)
      })
    });
    i++
  });
}

async function createTransactionsProcess(){
  let i = 0
  let price = globalConfig.base_price
  console.log("Process started")
  while(start) {
    getFakerData(1).then((response) => {
      let person = response[0]
      lastData = person
      let random = Math.ceil(Math.random() * globalConfig.price_random) * 1000
      let data = {}
      let x = i;
      data.height = 20
      data.length = 20
      data.width = 10
      data.weight = 1
      data.total_price = price + random
      data.shipping_price = 0
      data.expedition_attributes = {}
      data.expedition_attributes.name = "Kurir Pribadi"
      data.expedition_attributes.code = "pribadi"
      data.expedition_attributes.expedition_id = 20
      data.expedition_attributes.expedition_service_type = "Pribadi"
      data.customer_attributes = person
      console.log("createTransactionData "+x+" : " + person.customer_name)
      createTransactionData(data).then((res) => {
        console.log(res.data.id)
      })
    })
    console.log(i)
    i++
    let sec = Math.ceil(Math.random() * 1000)
    if (globalConfig.delay != 0) sec = globalConfig.delay
    lastDelay = sec
    lastTimeProcess = new Date().getTime()
    console.log("delay "+sec)
    await sleep(sec*1000)
  }
  console.log("Process stopped")
}

async function getFakerData(num){
  return axios.get(globalConfig.faker_url+num)
      .then(response => response.data)
      .catch(error => error.response)
}

async function createTransactionData(data){
  return axios.post('v2/transactions', data)
      .then(response => response.data)
      .catch(error => error.response)
}

async function sleep(millis) {
  return new Promise(resolve => setTimeout(resolve, millis));
}

module.exports = router;
