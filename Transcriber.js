const request = require('request');
const deasync = require('deasync'); // for making network/mongo calls sync so code reads like a script
const fs = require('fs');

module.exports.getTranscription = function (file) {

	console.log("file");
	console.log(file);



	var getWatson = deasync(transcribeAudio);

	try {
		console.log("try");
		var result = getWatson(file);
		console.log("result");
		console.log(result);
		return result;
	}
	catch(err) {
		console.log("err");
		console.log(err);
		process.exit();
	}
}

function transcribeAudio(file, callback) {



	var un = process.env.IBM_WATSON_USERNAME;
	var pw = process.env.IBM_WATSON_PASSWORD;

	fs.createReadStream(file)
		.pipe(request({
			uri: 'https://stream.watsonplatform.net/speech-to-text/api/v1/recognize?continuous=true&timestamps=true&word_confidence=true',
			method: 'POST',
			auth: {

				user: un,
				pass: pw

			},
			headers: {
				'Content-Type': 'audio/wav',
				'Transfer-Encoding': 'chunked'
			}
		}, (err, res, body) => {
			if (err)
				callback(err, null);
			else
				callback(null, body);
		}));
}

