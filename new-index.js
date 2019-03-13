"use strict";

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const events = require('events');
const _ = require('lodash');

var enrollAdmin = require("./enrollAdmin.js");
var registerUser = require("./registerUser.js");
var query = require("./query.js");
var block_height = require("./block_height.js");
var query_by_id = require("./query_by_block_id.js");

var eventEmitter = new events.EventEmitter();
var intervalTimer = [];

var blockCDRS = [];
var blockCDRA = [];
var hashCDRAcpid = {};
var hashCDRSbid = {};
var hashCDRAbid = {};
var height = 3;
var block = [];

const app = express();
const CHG_INT = 4000;
const BASE_INT = 3000;

//eventEmitter.on('reset', generateData);
//eventEmitter.on('off', initData);

app.use(cors());
app.use(bodyParser.json());

fetchData().then(()=>{
  setInterval(fetchData, BASE_INT);
});

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

app.get('/cdrs', (req, res) => {
  if (isEmpty(req.query)) {
    res.send({length: blockCDRS.length});
  } else if (req.query.blockId) {
    res.send(blockCDRS[hashCDRSbid[req.query.blockId]]);
  } else if (req.query.id) {
    res.send(blockCDRS[req.query.id]);
  }
});
app.get('/cdrs/all', (req, res) => {
  res.send(blockCDRS);
});
app.get('/cdrs/:id', (req, res) => {
  res.send(blockCDRS[req.params.id]);
});

app.get('/cdra', (req, res) => {
  if (isEmpty(req.query)) {
    res.send({length: blockCDRA.length});
  } else if (req.query.blockId) {
    res.send(blockCDRA[hashCDRAbid[req.query.blockId]]);
  } else if (req.query.id) {
    res.send(blockCDRA[req.query.id]);
  }

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

app.listen(8081, () => console.log('Example app listening on port 8081!'));

function generateHash() {
  let hash = crypto.createHmac('sha256', Math.random().toString()).digest('hex');
  return hash;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

async function fetchData() {

    let new_height = await block_height.block_height("tester");

    console.log(new_height, height);

    for (var i = height; i < Number(new_height); i++) {
      let blk = await query_by_id.query_by_id("tester", i);
      blk.forEach((tx) => {
        let txv = JSON.parse(tx.value);
        txv.blockId = tx.id;
        if (tx.key.includes("CDRA")) {
          blockCDRA.push(txv);
          hashCDRAcpid[txv.copyId] = blockCDRA.length - 1;
          hashCDRAbid[txv.blockId] = blockCDRA.length - 1;
        } else {
          if (txv.crc_check == false) {
            txv.cdraBlockId = blockCDRA[hashCDRAcpid[txv.copyId]].blockId;
            txv.cdraCrc = blockCDRA[hashCDRAcpid[txv.copyId]].crc;
          } else {
            txv.cdraBlockId = ' ';
            txv.cdraCrc = ' ';
            console.log(txv);
          }
          blockCDRS.push(txv);
          hashCDRSbid[txv.blockId] = blockCDRS.length - 1;
        }
      })
    }

    height = new_height;
}

