const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

module.exports.handler = (event, context, callback) => {
	console.log('Received event:', JSON.stringify(event, null, 2));
	var token = (event.authorizationToken || '').split('Bearer ')[1];
	console.log('token: ', token);
	if (!token) {
		callback(null, generate_policy('user', 'Deny', event.methodArn));
	} else {
		verifyToken(token).then(userId => {
			console.log('userId: ', userId);
			callback(null, generate_policy(userId, 'Allow', event.methodArn));
		}).catch(message => {
			console.log('msg: ', message);
			callback(null, generate_policy('user', 'Deny', event.methodArn));
		});
	}
};

function verifyToken(token) {
	return new Promise((resolve, reject) => {
		console.log('process.env.GOOGLE_CLIENT_ID: ', process.env.GOOGLE_CLIENT_ID);
		return client.verifyIdToken({
			idToken: token,
			audience:  process.env.GOOGLE_CLIENT_ID// Specify the CLIENT_ID of the app that accesses the backend
			// Or, if multiple clients access the backend:
			//[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
		}).then((ticket) => {
			console.log('ticket: ', ticket);
			const payload = ticket.getPayload();
			const email = payload['email'];
			resolve(email);
			// If request specified a G Suite domain:
			//const domain = payload['hd'];
		}).catch((err) => {
			console.log('err: ', err);
			reject(err);
		});
	});
}

function generate_policy(principalId, effect, resource) {
	return {
		principalId: principalId,
		policyDocument: {
			Version: '2012-10-17',
			Statement: [{
				Action: 'execute-api:Invoke',
				Effect: effect,
				Resource: resource
			}]
		}
	};
}
