module.exports = {



  uniqueElements: function(arr, fn) {
    var unique = {};
    var distinct = [];
    arr.forEach(function(x) {
      var key = fn(x);
      if (!unique[key]) {
        distinct.push(key);
        unique[key] = true;
      }
    });
    return distinct;
  },


  getRandomInt: function(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }


}