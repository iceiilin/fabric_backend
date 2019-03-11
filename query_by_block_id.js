'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */

var exports = module.exports = {};

exports.query_by_id = function(name, id) {
  // system arguments
  var arg = process.argv.splice(2);
  var user = name || arg[0];
  var bid = id || arg[1];
  bid = Number(bid)

  var Fabric_Client = require('fabric-client');
  var path = require('path');
  var util = require('util');
  var os = require('os');

  //
  var fabric_client = new Fabric_Client();

  // setup the fabric network
  var channel = fabric_client.newChannel('mychannel');
  var peer = fabric_client.newPeer('grpc://10.32.105.215:30001');
  channel.addPeer(peer);

  //
  var member_user = null;
  var store_path = path.join(__dirname, 'hfc-key-store');
  //console.log('Store path:'+store_path);
  var tx_id = null;
  // create the key value store as defined in the fabric-client/config/default.json 'key-value-store' setting
  return Fabric_Client.newDefaultKeyValueStore({ path: store_path
  }).then((state_store) => {
    // assign the store to the fabric client
    fabric_client.setStateStore(state_store);
    var crypto_suite = Fabric_Client.newCryptoSuite();
    // use the same location for the state store (where the users' certificate are kept)
    // and the crypto store (where the users' keys are kept)
    var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
    crypto_suite.setCryptoKeyStore(crypto_store);
    fabric_client.setCryptoSuite(crypto_suite);

    // get the enrolled user from persistence, this user will sign all requests
    return fabric_client.getUserContext(user, true);
  }).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
      //console.log('Successfully loaded ' + user + ' from persistence');
      member_user = user_from_store;
    } else {
      throw new Error('Failed to get' + user + '.... run registerUser.js');
    }

    // send the query proposal to the peer
    return channel.queryBlock(bid).then((query_responses) => {

      console.log('*************************************************************');
      console.log('Block ID: ' + query_responses.header.number.toString());
      console.log('Number of Tx: ' + query_responses.data.data.length.toString());

      var tx = [];
      for (var i = 0; i < query_responses.data.data.length; i++){
        //console.log('Checking tx number: ' + i.toString());
        // https://github.com/hyperledger/fabric-sdk-go/blob/master/third_party/github.com/hyperledger/fabric/protos/peer/transaction.pb.go
        // int[]
        tx[i] = {id: bid};
        if (query_responses.metadata.metadata[2][i] == 0) {
          tx[i].valid = 0;
          //console.log('This tx is valid!');
        }
        else {
          tx[i].valid = 1;
          //console.log('This tx is invalid!');
        }
        if (query_responses.header.number > 2) {
          //console.log('Key:');
          tx[i].key = query_responses.data.data[i].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[1].rwset.writes[0].key;
          //console.log(tx[i].key);
          //console.log('Value:');
          tx[i].value = query_responses.data.data[i].payload.data.actions[0].payload.action.proposal_response_payload.extension.results.ns_rwset[1].rwset.writes[0].value;
          //console.log(tx[i].value);
        }
        console.log(tx[i]);
        console.log('*************************************************************');
      }
      return tx;
      console.log('End of Record');
    })
  });
}
