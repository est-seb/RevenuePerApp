"use strict";
var fs = require('fs');

var nbFiles = 0;
var nbFilesProcessed = 0;
var currencyCode_AppLocalCurrency = {};
var currencyCode_AppTargetedCurrency = {};
var currencyCode_currencyRate = {};
var app_TargetedCurrencyTotal = {};

var revenuePerApp = {
  processFile : function(filePath){
    fs.readFile(filePath, 'utf8', function (err,data) {
        nbFilesProcessed++;
        if (err) {
          return console.log(err);
        }

        var arrayOfLines = revenuePerApp.getArrayOfLines(data);
        var line = "";
        var arrayOfStrings = [];
        var app_LocalCurrencyShareMap = {};

        if (filePath.toUpperCase().indexOf("currency_rate".toUpperCase())>-1) {
          //Currency rate loading
          for (var i = 0; i < arrayOfLines.length; i++) {
              line = arrayOfLines[i];
              arrayOfStrings = line.split(";");
              currencyCode_currencyRate[arrayOfStrings[0]] = parseFloat(arrayOfStrings[1]);
          }

        } else {
          //Read earnings files
          var header = "";
          var appName = "";
          var extendedPartnerShare = 0;
          var localCurrencyCode = "";
          var countryCode = "";

          for (var i = 0; i < arrayOfLines.length; i++) {
            if (i==0) {
              header = arrayOfLines[i];
            } else {
              line = arrayOfLines[i];
              arrayOfStrings = line.split("	");

              if (header.split("	").length == arrayOfStrings.length) {
                appName = arrayOfStrings[12];
                extendedPartnerShare = parseFloat(arrayOfStrings[7]);
                localCurrencyCode = arrayOfStrings[8];
                countryCode = arrayOfStrings[17];
                // console.log("Country code : "+countryCode);
                // console.log("App name : "+appName);
                // console.log("Extended partner share : "+extendedPartnerShare);
                // console.log("Currency : "+localCurrencyCode);
                if (app_LocalCurrencyShareMap.hasOwnProperty(appName)) {
                  // console.log(appName+" deja dans la map");
                  app_LocalCurrencyShareMap[appName] = parseFloat(app_LocalCurrencyShareMap[appName]) + parseFloat(extendedPartnerShare);
                  // console.log("nouvelle valeur = "+app_LocalCurrencyShareMap[appName]);
                } else {
                  app_LocalCurrencyShareMap[appName] = extendedPartnerShare;
                }
              }
            }
          }

          //Store apps total shares in local currency in global map
          currencyCode_AppLocalCurrency[localCurrencyCode] = app_LocalCurrencyShareMap;
        }

        //Currency rates are necessary for the rest of the calculation
        if (nbFiles==nbFilesProcessed && currencyCode_currencyRate!=={}) {
          console.log("Last file processed");
          //Calculation of shares in the targeted currency
          for (var currencyCode in currencyCode_AppLocalCurrency) {
            if (currencyCode_AppLocalCurrency.hasOwnProperty(currencyCode)) {
              var app_TargetCurrencyShareMap = {};
              console.log(currencyCode_AppLocalCurrency[currencyCode]);
              app_LocalCurrencyShareMap = currencyCode_AppLocalCurrency[currencyCode];
              for (var appName in app_LocalCurrencyShareMap) {
                if (app_LocalCurrencyShareMap.hasOwnProperty(appName)) {
                  //Get currency rate according to currency code
                  var rate = parseFloat(currencyCode_currencyRate[currencyCode]);
                  var shareInTargetedCurrency = parseFloat(app_LocalCurrencyShareMap[appName]) * rate;
                  app_TargetCurrencyShareMap[appName] = shareInTargetedCurrency;

                  if (app_TargetedCurrencyTotal.hasOwnProperty(appName)) {
                    app_TargetedCurrencyTotal[appName] = parseFloat(app_TargetedCurrencyTotal[appName]) + shareInTargetedCurrency;
                  } else {
                    app_TargetedCurrencyTotal[appName] = shareInTargetedCurrency;
                  }
                }
              }
              //Store apps total shares in targeted currency in global map
              currencyCode_AppTargetedCurrency[currencyCode] = app_TargetCurrencyShareMap;
            }
          }

          //Reset counter for futur use in the same session
          nbFilesProcessed = 0;

          //display results
          var resultsText = "<p>Total revenue per app : </p>";
          for (var appName in app_TargetedCurrencyTotal) {
            if (app_TargetedCurrencyTotal.hasOwnProperty(appName)) {
              resultsText = resultsText + appName + " : " + app_TargetedCurrencyTotal[appName] + "\n";
            }
          }
          document.getElementById("results").innerHTML = resultsText;
          document.getElementById("results").style.display = 'block';
          // console.log(currencyCode_AppTargetedCurrency);
          // console.log(app_TargetedCurrencyTotal);
        }
    });
  },

  getArrayOfLines : function(wholeText){
    var arrayOfLines = wholeText.match(/[^\r\n]+/g);
    return arrayOfLines;
  }
};
