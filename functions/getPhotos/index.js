'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({apiVersion: '2006-03-01'});

const STORAGE_NAME = process.env.STORAGE_NAME;
const ORIGIN_URL = process.env.ORIGIN_URL;

module.exports.handler = (event, context, callback) => {
	console.log('Received event:', JSON.stringify(event, null, 2));
	var query = event.queryStringParameters || {prefix:''};
	getPhotosList(STORAGE_NAME, query.prefix).then((data) => {
		callback(null, lambdaUtil(200, data));
	}).catch((err) => {
		callback(null, lambdaUtil(500, err));
	});
};

function lambdaUtil(statusCode, data){
	return {
		statusCode: statusCode,
		headers: {
			'Access-Control-Allow-Origin': ORIGIN_URL,
			'Access-Control-Allow-Credentials': 'true',
			'Content-Type': 'application/json'
		},
		body: data ? JSON.stringify(data) : ''
	};
}

function getPhotosList(bucket_name, prefix){
	return new Promise((resolve, reject) => {
		var params = {
			Bucket: bucket_name,
			Prefix: 'photos/' + prefix
		};
		console.log('params: ', params);
		S3.listObjectsV2(params, function(err, data) {
			if (err){
				console.log(err, err.stack); // an error occurred
				reject(err);
			} else {
				console.log(data);           // successful response
				var res = {keys:[]};
				for(var i=0; i < data.Contents.length; i++){
					res.keys.push(bucket_name + '/' + data.Contents[i].Key);
				}
				resolve(res);
			}
		});
	});
}
