
const AWS = require('aws-sdk');
// Set the region 
const REGION = "us-west-2"; //e.g. "us-east-1"
AWS.config.update({region: REGION});


// Set the parameters
const params = {
  Destination: {
    /* required */
    CcAddresses: [
      /* more items */
    ],
    ToAddresses: [
      "jadcve@gmail.com", //RECEIVER_ADDRESS
      /* more To-email addresses */
    ],
  },
  Message: {
    /* required */
    Body: {
      /* required */
      Html: {
        Charset: "UTF-8",
        Data: "Status : Servicio OK",
      },
      Text: {
        Charset: "UTF-8",
        Data: "Status : Servicio OK",
      },
    },
    Subject: {
      Charset: "UTF-8",
      Data: "Monitoreo de Servidor  ",
    },
  },
  Source: "jadcve@gmail.com", // SENDER_ADDRESS
  ReplyToAddresses: [
    "alain.diaz.2612@gmail.com"
  ],
};

 // Create the promise and SES service object
 let sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(params).promise();

 // Handle promise's fulfilled/rejected states
 sendPromise
     .then(
         function(data) {
             console.log(data.MessageId);
             console.log("EJECUTADO EXITOSAMENTE");
         })
     .catch(
         function(err) {
             console.error(err, err.stack);
             
     });
