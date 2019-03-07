"use strict";

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const events = require('events');
const _ = require('lodash');
var eventEmitter = new events.EventEmitter();
var timeoutTimer = [];
var intervalTimer = [];
var p = [], q = [], t = [], r;

var blockCDRS = [];
var blockCDRA = [];

const app = express();
const CAR_NUM = 10;
const DC_NUM = 6;
const EDGE_NUM = 4;
const CHG_INT = 4000;
const BASE_INT = 3000;

eventEmitter.on('reset', generateData);
eventEmitter.on('off', initData);

app.use(cors());
app.use(bodyParser.json());

generateData();
app.get('/cdrs', (req, res) => {
  res.send({length: blockCDRS.length});
});
app.get('/cdrs/all', (req, res) => {
  res.send(blockCDRS);
});
app.get('/cdrs/:id', (req, res) => {
  res.send(blockCDRS[req.params.id]);
});

app.get('/cdra', (req, res) => {
  res.send({length: blockCDRA.length});
});
app.get('/cdra/all', (req, res) => {
  res.send(blockCDRA);
});
app.get('/cdra/:id', (req, res) => {
  res.send(blockCDRA[req.params.id]);
});

//app.post('/restart', (req, res) => {
  //eventEmitter.emit(req.body.action);
  //res.send("success");
//});

//app.post('/policy', (req, res) => {
  //policy.placement.policy.args = req.body;
  //replicaPolicy = req.body;
  //res.send(req.body);
//});

app.listen(8080, () => console.log('Example app listening on port 8080!'));

function getNode() {
  return node;
}

function generateHash() {
  let hash = crypto.createHmac('sha256', Math.random().toString()).digest('hex');
  return hash;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function initData() {
  // Stop timer
  t.concat(p).concat(q).forEach((timer) => {
    clearTimeout(timer);
  })

  t.length = 0;
  p.length = 0;
  q.length = 0;
  console.log('clear timer');

  intervalTimer.forEach((timer) => {
    clearInterval(timer);
  })
  console.log('clear interval');
}

function generateCDRA() {
  let index = blockCDRA.length - 1;
  blockCDRA.push({
		"copyId" : generateHash(),
		"vmId" : "503c9214-b638-2129-e0db-a5d4bc40837a",
		"copyTime" : "2018-11-21T11:18:34Z",
		"copySourceType" : "CDRA",
		"diskName" : "flat-	CLDRENV37_VMs_DS_env37cdrs-AutomatedVM1-1541671589153_env37cdrs-AutomatedVM1-1541671589153.vmdk",
		"crc" :  123123123
	});
}

function generateCDRS() {
  let index = blockCDRS.length - 1;
  blockCDRS.push({
		"copyId" : generateHash(),
		"vmId" : "503c9214-b638-2129-e0db-a5d4bc40837a",
		"copyTime" :"2019-11-21T11:18:34Z",
		"copySourceType" : "CDRS",
		"diskName" : "flat-CLDRENV37_VMs_DS_env37cdrs-AutomatedVM1-1541671589153_env37cdrs-AutomatedVM1-1541671589153.vmdk",
		"crc" :  123123123
  });
}

function generateData() {
  initData();
  // Generate data and reserve protect time
  intervalTimer.push(setInterval(function() {
    generateCDRA();
  }, getRandomInt(CHG_INT) + BASE_INT ));
  intervalTimer.push(setInterval(function() {
    generateCDRS();
  }, getRandomInt(CHG_INT) + BASE_INT ));

}


