const AWS = require("aws-sdk");

AWS.config.update({region: 'sa-east-1'});

const SQS = new AWS.SQS();

class QueueTest {

    constructor() {
        this.queueUrl = null;
    }

    createQueue() {
        let getUrlPromise = new Promise((resolve, reject) => {
            let params = {
                QueueName: "Default"
            };
            
            SQS.createQueue(params, (err, data) => {
                data ? resolve(data.QueueUrl) : reject(err);
            });
        });

        getUrlPromise.then((url) => {
            this.queueUrl = url;
        })

        return getUrlPromise;
    }
    
    sendMessage(iteration) {
        let params = {
            MessageAttributes: {
                "Title": {
                    DataType: "String",
                    StringValue: `${iteration}`
                },
                "Author": {
                    DataType: "String",
                    StringValue: `${iteration}`
                }
            },
            MessageBody: `Message ${iteration}`,
            QueueUrl: this.queueUrl,
        };
        
        return new Promise((resolve, reject) => {
            SQS.sendMessage(params, (err, data) => {
                if (data) {
                    console.log(data);
                }
                data ? resolve(data) : reject(err);
            });
        })
    }
    
    consumeMessages() {
        let params = {
            QueueUrl: this.queueUrl,
            VisibilityTimeout: 600,
            MaxNumberOfMessages: 1
        }
        
        return new Promise((resolve, reject) => {
            SQS.receiveMessage(params, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    if (data.Messages) {
                        let deleteParams = {
                            QueueUrl: params.QueueUrl,
                            ReceiptHandle: data.Messages[0].ReceiptHandle
                        };
            
                        SQS.deleteMessage(deleteParams, (errDelete) => {
                            if (errDelete)
                                reject(errDelete);
                            else {
                                resolve(`Message Deleted: ${data}`);
                            }
                        });
                    } else {
                        // console.log(`No messages available`);
                        resolve('No messages');
                    }
                }
            });
        });
    }
}

function executeTest(queueTest) {
    let requests = new Array();
    
    for (i = 0; i < 1700; i++) {
        requests.push(queueTest.sendMessage(i));
    }

    return requests;
}

function executeConsumer() {
    let consumer = new Array();
    
    for (j = 0; j < 2000; j++) {
        consumer.push(queueTest.consumeMessages());
    }
    return consumer;
}

let queueTest = new QueueTest();

queueTest.createQueue().then(() => {
    let messageCreation = executeTest(queueTest);

    Promise.all(messageCreation).then(() => {
        
        executeConsumer();
        
        setTimeout(executeConsumer, 30000);
    
    });
});

