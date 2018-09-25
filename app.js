const AWS = require("aws-sdk");
const express = require("express");
const bodyParser = require("body-parser");

let app = express();
app.use(bodyParser.json());

AWS.config.update({region: 'sa-east-1'});

const SQS = new AWS.SQS();


app.post("/queue", (req, res) => {
    let params = {
        QueueName: req.body.name || "Default"
    };
    
    SQS.createQueue(params, (err, data) => res.send(err || data));
});

app.get("/queue", (req, res) => {
    SQS.listQueues((err, data) => res.send(err || data));
})

app.delete("/queue", (req, res) => {
    let params = {
        QueueUrl: req.body.queueUrl
    };

    SQS.deleteQueue(params, (err, data) => res.send(err || data));
});

app.post("/message", (req, res) => {
    let params = {
        MessageAttributes: {
            "Title": {
                DataType: "String",
                StringValue: req.body.title
            },
            "Author": {
                DataType: "String",
                StringValue: req.body.author
            }
        },
        MessageBody: req.body.message,
        QueueUrl: req.body.queueUrl,
    }; 

    SQS.sendMessage(params, (err, data) => res.send(err || data));
});

app.get("/message", (req, res) => {
    let params = {
        QueueUrl: req.query.queueUrl,
        VisibilityTimeout: 600,
        MaxNumberOfMessages: 1
    }
    SQS.receiveMessage(params, (err, data) => {
        if (err) {
            res.send(err);
        } else {
            
            if (data.Messages) {
                let deleteParams = {
                    QueueUrl: params.QueueUrl,
                    ReceiptHandle: data.Messages[0].ReceiptHandle
                };
    
                SQS.deleteMessage(deleteParams, (errDelete) => {
                    if (errDelete)
                        res.send(errDelete);
                    else {
                        res.send(data);
                    }
                });
            } else {
                res.send(data);
            }
        }
    });
});

app.listen(8000);
console.log("Server Started!");