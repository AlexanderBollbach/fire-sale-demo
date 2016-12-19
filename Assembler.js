const execSync = require('child_process').execSync;
const fs = require('fs');
const ff_helper = require('./FF_Helper.js');
const helper = require('./Helper.js');
const s3 = require('./S3_Manager.js');

exports.assemble = function(string, db) {

	configureTemp();


	var userWords = string.split(" ").map(v => v.toLowerCase());

	var wordsUnique = [];

	var wordsFromDB = db.findWords(userWords); // find all words (including multiples)

	//  for each word, filter the word array out, and pick a random one, then place it in wordsUnique
	userWords.forEach(word => {

		var thisWordBatch = wordsFromDB.filter(wordObject => {
			return wordObject.word == word;
		});

		var chosenWordForWord = thisWordBatch[helper.getRandomInt(0, thisWordBatch.length - 1)];

		// // why would it be undefined?
		if (chosenWordForWord != undefined) {
			wordsUnique.push(chosenWordForWord);
		}
	});

	const s3Keys = helper.uniqueElements(wordsUnique, x => x.sourceVideo);
	console.log(s3Keys);

	s3Keys.forEach(key => {
		s3.downloadFile(`tmp/${key}`, key);
	});

	console.log("finished bring s3 videos local");

	wordsUnique.forEach((word, index) => {
		makeClip(word, index)
	});

	var streams = fs.readdirSync('./tmp/clips').sort();

	concatIntoFinal(streams);

	db.close();
}



function makeClip(word, index) {

	var startTime = ff_helper.getVideoProperty(`tmp/${word.sourceVideo}`, "start_time");

	console.log("startTime");
	console.log(startTime);


	console.log(word);

	var sourceFile = word.sourceVideo;
	var start = word.start; // correct for weird start_time issues caused by ffmpeg and transcoding.. iframes.. w00t
	var duration = word.end - word.start + 0.01; // give some breathing room?
	var outputFile = `tmp/clips/${index}-${word.word}.ts`;



	var cmd = `ffmpeg -loglevel panic -i ./tmp/${sourceFile} -ss ${start} -t ${duration} ${outputFile}`;
	execSync(cmd);

}



function concatIntoFinal(filenames) {

	var intermediates = "concat:";
	filenames.forEach(path => {
		intermediates += "tmp/clips/" + path + "|"
	})

	intermediates = intermediates.substring(0, intermediates.length - 1); // remove trailing |

	var cmd = `ffmpeg -loglevel panic -i "${intermediates}" -c copy -bsf:a aac_adtstoasc tmp/final_output.mp4`

	console.log(cmd);
	execSync(cmd, function(error, out, err) {
		console.log(error);
		console.log(out);
	})



	// var cmd = `ffmpeg -loglevel panic -i ./tmp/final_output.mp4 tmp/final_output_playable?.mp4`

	// execSync(cmd, function(error, out, err) {
	// 	console.log(error);
	// 	console.log(out);
	// })
}



function configureTemp() {


	var dir = './tmp';
	var clips = './tmp/clips';

	const del = require('del');
	// clear .tmp
	del.sync(dir);
	del.sync("./clips");



	//create .tmp
	if (!fs.existsSync(dir)) fs.mkdirSync(dir);
	if (!fs.existsSync(clips)) fs.mkdirSync(clips);
}

