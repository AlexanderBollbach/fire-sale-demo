const deasync = require('deasync'); // for making network/mongo calls sync so code reads like a script

require('dotenv').config(); // s3 creds



var s3 = require('s3');

var client = s3.createClient({
  maxAsyncS3: 20, // this is the default 
  s3RetryCount: 3, // this is the default 
  s3RetryDelay: 1000, // this is the default 
  multipartUploadThreshold: 20971520, // this is the default (20 MB) 
  multipartUploadSize: 15728640, // this is the default (15 MB) 
  s3Options: {
    accessKeyId: process.env.s3Key,
    secretAccessKey: process.env.s3Secret,
    // any other options are passed to new AWS.S3() 
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property 
  }
});



module.exports = {



  downloadFile: function(localFile, s3Key) {



    var dlFileSync = deasync(downloadFileAsync);

    try {
      return dlFileSync(localFile, s3Key);
    } catch (err) {
      // console.log("here");
      console.log(err);
      process.exit();
    }

  },

  uploadFile: function(path, videoKey) {



    var params = {
      localFile: path,

      s3Params: {
        Bucket: "fire-sale-storage",
        Key: `${videoKey}`,
        // other options supported by putObject, except Body and ContentLength. 
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property 
      },
    };
    var uploader = client.uploadFile(params);
    uploader.on('error', function(err) {
      console.error("unable to upload:", err.stack);
    });
    uploader.on('progress', function() {
      console.log("progress", uploader.progressMd5Amount,
        // uploader.progressAmount, uploader.progressTotal);
    });
    uploader.on('end', function() {
      console.log("done uploading");

    });

  }



}









function downloadFileAsync(localFile, s3Key, cb) {



      var params = {
      localFile: localFile,

      s3Params: {
        Bucket: "fire-sale-storage",
        Key: s3Key,
        // other options supported by getObject 
        // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property 
      },
    };
    var downloader = client.downloadFile(params);
    downloader.on('error', function(err) {
      // console.error("unable to download:", err.stack);
    });
    downloader.on('progress', function() {
      // console.log("progress", downloader.progressAmount, downloader.progressTotal);
    });
    downloader.on('end', function() {
      // console.log("done downloading");
      cb(null, true);
    });
}