/* ===========================================================
hiDataGenSQS.js
Writes generated requests for research to historicalindicator SQS
=========================================================== */

const express = require('express');
const app = express();
const dataGenFunctions = require('./hiFunctions.js'); // all data generation functions


/* ===========================================================
AWS/SQS credentials and SQS instantiation
=========================================================== */
const AWS = require('aws-sdk');
const queueUrl = "http://sqs.us-west-1.amazonaws.com/481569304347/historicalindicator";

AWS.config.loadFromPath('../sqs/config.json');

const myCredentials = new AWS.CognitoIdentityCredentials({ IdentityPoolId: 'IDENTITY_POOL_ID' });
const myConfig = new AWS.Config({ credentials: myCredentials, region: 'us-west-1' });
const sqs = new AWS.SQS(); // Instantiate SQS

AWS.events.on('httpError', () => {
  if (this.response.error && this.response.error.code === 'UnknownEndpoint') {
    this.response.error.retryable = true;
  }
});

/* ===========================================================
Generate and send 1000 user sessions to sessioninfo queue
=========================================================== */

let generateBundles = () => {
  for (var n = 0; n < 10; n++) {

    /* ===========================================================
    Attributes contains user ID
    =========================================================== */
    let attributes = {
      user_id: dataGenFunctions.newUser()
    }


    /* ===========================================================
    Payload contains single historical indicator request
    =========================================================== */
    let payload = {
      payload: dataGenFunctions.hiRequest()
    }


    /* ===========================================================
    Message parameters contains JSON information to send to queue
    =========================================================== */
    let params = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(payload),
      MessageAttributes: {
        user_id: { DataType: 'Number', StringValue: JSON.stringify(attributes.user_id) },
      },
      DelaySeconds: 0
    };


    /* ===========================================================
    Send message with complete session info to SQS
    =========================================================== */
    sqs.sendMessage(params, (err, data) => {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("Success", data.MessageId);
      }
    });
  }
}

var timesRun = 0;
var interval = setInterval(() => {
  timesRun++;
  if (timesRun === 2) {
    clearInterval(interval);
  }
  generateBundles();
}, 2000); 
