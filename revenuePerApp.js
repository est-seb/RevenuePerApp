"use strict";
var fs = require('fs');

var revenuePerApp = {
  processFile : function(filePath){
    fs.readFile(filePath, 'utf8', function (err,data) {
        if (err) {
          return console.log(err);
        }
        var arrayOfLines = revenuePerApp.getArrayOfLines(data);
        var line = "";
        var header = "";
        var arrayOfStrings = [];
        for (var i = 0; i < arrayOfLines.length; i++) {
          if (i==0) {
            header = arrayOfLines[i];
          } else {
            line = arrayOfLines[i];
            arrayOfStrings = line.split("	");
            if (header.split("	").length == arrayOfStrings.length) {
              console.log(arrayOfStrings[12]);
              console.log(arrayOfStrings[4]);
              console.log(arrayOfStrings[7]);
            }
          }
        }
    });
  },

  getArrayOfLines : function(wholeText){
    var arrayOfLines = wholeText.match(/[^\r\n]+/g);
    return arrayOfLines;
  }
};
