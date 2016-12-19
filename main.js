const args = require('yargs').argv

const dbCollection = "test"; // is this used?



// db required for all functionality so just sync up at start

// it makes no sense to do everything async as if its a webserver and not a script
//  0% of the time will database not work and it make sense to do anything else
// programming model is wrong for scripts

const db = require('./DB.js');

if (args.i) { // -i indexes movie at filepath
	indexThisMovie(args.i, args.n);
} else if (args.m) { // -m creates movie from string
	assembleThisString(args.m);
} 



function indexThisMovie(path, name) {



	db.connect(function(err) {
		if (!err) {
			const indexer = require('./indexer.js').index(path, name, db);
		} else {
			console.log(err);
		}
	});
}



function assembleThisString(string) {
	db.connect(function(err) {

		if (!err) {
			const assembler = require('./Assembler.js').assemble(string, db);
		} else {
			console.log(err);
		}

	});
}



function testSomeComponent(componentName) {
	if (componentName == 'db') {
		testDB()
	}
}




function testDB() {

	console.log("test DB");

	const db = require('./DB.js');

	db.save({
		"test": "test"
	});


}