const exec = require('child_process').execSync;



module.exports = {



	getVideoProperty: function(filepath, property) {

		var command = `ffprobe -v error -show_entries format=${property} -of default=noprint_wrappers=1:nokey=1 ${filepath}`;
		var output = exec(command);


		return output.toString();

	},



	getRandomInt: function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;

	},



	GUID: function() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	}
}