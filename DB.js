var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
require('dotenv').config(); // watson credentials
const deasync = require('deasync'); // for making network/mongo calls sync so code reads like a script

const numWordDup = 5;


var url = `mongodb://${process.env.mLab_un}:${process.env.mLab_pw}@ds127948.mlab.com:27948/fire-sale-index`;

var dbConnection = null;
var collection = null;


module.exports = {

	connect: function(callback) {
		MongoClient.connect(url, function(err, db) {
			if (err) {
				console.log('Unable to connect to the mongoDB server. Error:', err);
				callback(err);
			} else {
				dbConnection = db;
				collection = db.collection('test');
				callback(null);
			}
		});
	},



	
	findWords: function(words) {

		var findWordsSync = deasync(findWords);

		try {
			return findWordsSync(words);
		} catch (err) {
			// console.log("here");
			console.log(err);
			process.exit();
		}
	},

	close: function() {
		dbConnection.close();
	},

	// saves a word iff it has a greater confidence than the numWordDups already in the DB, or it simply adds if num in DB > numWordsDup
	saveWord: function(wordToAdd) {

		var addWordSync = deasync(saveWordToDB);

		try {
			return addWordSync(wordToAdd);
		} catch (err) {
			// console.log("here");
			// console.log(err);
			process.exit();
		}
	}
}


function findWords(words, cb) {

	collection.find({
		word: {
			$in: words
		}
	}).toArray(function(err, res) {
		if (!err) {
			cb(null, res);
		}
	});
}


function saveWordToDB(wordToAdd, callback) {

	const conf = wordToAdd.confidence;

	collection.find({
		"word": wordToAdd.word
	}, function(err, cursor) {

		cursor.toArray().then(function(matches) {

			if (matches.length >= numWordDup) {

				matches = matches.filter(function(item, idx) {
					return item.confidence < conf;
				});

				if (matches.length > 0) {

					var staleMatch = matches[0]; // hackey solution because i assume there will only be one element because as soon as i add more doc.word=="someWord" than numDupWords the filter operation will yield the previous worst confidence word.  looking for a way to do this more intelligently using mongo tech
					collection.updateOne(staleMatch, wordToAdd, function(err, obj) {
						console.log("added a word a higher confidence word");
						callback(false, true);
					});
				} else {
					console.log("rejected word");
					callback(false, false);
				}
			} else {
				addOneWord(wordToAdd);
				console.log("added a word automatically before numDupWords is reached")
				callback(false, true);
			}
		});
	});
}



function addOneWord(word) {


	collection.insert(word, {
		w: 1
	}, function(err, result) {

		if (err) {
			// console.log("err in add one word");
			console.log(err);
		} else {
			// console.log("sucess in add one word");
			// console.log(result);
		}
	});
}