'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.createItem = (event, context, callback) => {
  const data = event.body;
  const { serialNumber, materialNumber } = JSON.parse(data);

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      id: uuid.v4(),
      serialNumber,
      materialNumber,
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
    },
  };

  dynamoDb
    .put(params, (error) => {
      if (error) {
        console.error(error);

        callback(null, {
          statusCode: error.statusCode || 501,
        });
        return;
      }

      callback(null, {
        statusCode: 200,
        body: JSON.stringify(params.Item),
      });
    })
    .promise();
};

module.exports.editItem = (event, context, callback) => {
  const data = event.body;
  const { newSerialNumber, oldserialNumber, materialNumber } = JSON.parse(data);

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      serialNumber: oldserialNumber,
      materialNumber,
    },
    UpdateExpression: 'SET serialNumber = :newValue',
    ExpressionAttributeValues: {
      ':newValue': newSerialNumber,
    },
  };

  dynamoDb
    .update(params, (error) => {
      if (error) {
        console.error(error);

        callback(null, {
          statusCode: error.statusCode || 501,
        });
        return;
      }

      callback(null, {
        statusCode: 200,
        body: JSON.stringify({}),
      });
    })
    .promise();
};

module.exports.deleteItem = (event, context, callback) => {
  const data = event.body;
  const { serialNumber, materialNumber } = JSON.parse(data);

  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      serialNumber,
      materialNumber,
    },
  };

  dynamoDb
    .delete(params, (error) => {
      if (error) {
        console.error(error);

        callback(null, {
          statusCode: error.statusCode || 501,
        });
        return;
      }

      callback(null, {
        statusCode: 200,
        body: JSON.stringify({}),
      });
    })
    .promise();
};

module.exports.dispatcher = async (event, context) => {
  const eventData = event.Records[0];

  const params = {
    Message: `Message at ${Date()}`,
    Subject: 'New message from publisher',
    TopicArn: process.env.TOPIC,
    MessageAttributes: eventData.dynamodb.NewImage,
  };

  const result = await new AWS.SNS().publish(params).promise();
  result
    .then(function (data) {
      console.log(
        `Message ${params.Message} sent to the topic ${params.TopicArn}`
      );
      console.log('data ' + data);
    })
    .catch(function (err) {
      console.error(err, err.stack);
    });
};
