// indexer accept a filepath to a movie file (preferably mp4)
// uses speech translation service (watson) to create an array of word objects (storing start time, end time and source file)
// each element in array is stored as document in mongo collection
const execSync = require('child_process').execSync;
const fs = require('fs');
const s3 = require('./S3_Manager.js');
const helpers = require('./FF_Helper.js');
const transcriber = require('./Transcriber');
require('dotenv').config(); // watson credentials


const minConfidence = 0.85;
var database;

exports.index = function(path, name, db) {

	configureTemp();
	database = db;

	execSync(`ffmpeg -i ${path} -acodec copy -f segment -segment_time 10 -vcodec copy -reset_timestamps 1 -map 0 ./tmp/%d.ts`);
	var files = fs.readdirSync('./tmp');

	files.forEach(file => {
		indexFile(`./tmp/${file}`, name);
		console.log(file);
	});

	database.close();
}

function indexFile(file, name) {

	var GUID = helpers.GUID();


	const segmentKey = `${name}-${GUID}.ts`;
	// name wav file (segmendID).wav
	const segmentSound = `tmp/${GUID}.wav`;
	execSync(`ffmpeg -loglevel panic -y -i ${file} -q:a 0 -map a ${segmentSound}`); // TODO: shouldn't fail but add error checking 

	// segmentSound is wav file in ./tmp for current segmentID
	var jsonResponse = transcriber.getTranscription(segmentSound)

	// get local-data-type <Word> array
	var words = parseWatsonJson(jsonResponse, segmentKey);

	// if words (confidence > minConfidence) has 1 or more we need sourcevideo for later reference so store in bucket
	if (words.length == 0) {
		console.log("no words in segment")
		return;
	}


	console.log("sending parsed words to mongodb");
	console.log(words);

	var savedAny = false;
	// now add array of best words to mongo
	words.forEach(word => {

		// addSave means a given <Word> was inserted, therefore the sourceVideo must be saved into s3 for future clipping
		var didSave = database.saveWord(word);

		if (didSave == true) {
			savedAny = true;
		}
	});

	if (savedAny) {
		s3.uploadFile(file, segmentKey);
	}
}



// synchronously extra an array of Words from Watson's json response
function parseWatsonJson(json, segmentFileName) {

	console.log("parse jjson");
	var rootObject = JSON.parse(json);

	if (!rootObject.results.length >= 1) {
		console.log("no results. possibly did not contain words");
	}

	var results = rootObject.results;

	var words = [];

	results.forEach(function(result) {


		// current assumption is that all result objects will have 1 and only 1 alternative as per http parameters.  i assume this alternative is the most accurate
		var wordConfidences = result.alternatives[0].word_confidence;
		var wordTimeStamps = result.alternatives[0].timestamps;

		// paranoia
		if (wordConfidences.length != wordTimeStamps.length) {
			console.log("length != length");
			process.exit();
		}


		// loop through words (confidences, timestamps) and save best candidates
		for (var i = 0; i < wordConfidences.length; i++) {

			var confidenceVal = wordConfidences[i][1];
			var word = wordTimeStamps[i][0].toLowerCase();

			if (word == "%HESITATION") {
				continue;
			}

			if (confidenceVal < minConfidence) {
				continue;
			}

			var startTime = wordTimeStamps[i][1];
			var endTime = wordTimeStamps[i][2];

			var word = {
				word: word,
				start: startTime,
				end: endTime,
				confidence: confidenceVal,
				sourceVideo: segmentFileName
			};
			words.push(word);
		}
	});

	return words;
}


function reencodeIfNeeded() {

	// alternative is to request the right bitrate watson model.. else just convert to expected rate

	// exec(recodeTo16000, function(error, stdout, stderr) {
	//   // console.log("parse audio error \n\n" + error);
	//   // console.log("parse audio stderr \n\n" + stderr);
	//   // console.log("parse audio stdout \n\n" + stdout);
	// });
}



function configureTemp() {

	var dir = './tmp';
	const del = require('del');
	del.sync(dir); // clear .tmp
	if (!fs.existsSync(dir)) fs.mkdirSync(dir); //create .tmp
}