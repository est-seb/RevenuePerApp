"use strict";
var fs = require('fs');

var currencyRateFileFound = false;
var nbFiles = 0;
var nbFilesProcessed = 0;
var currencyCode_AppLocalCurrency = {};
var currencyCode_AppTargetedCurrency = {};
var currencyCode_currencyRate = {};
var app_TargetedCurrencyTotal = {};

var beginningBalanceMap = {};
var withholdingTaxMap = {};

var NO_CURRENCY_RATE_FILE_FOUND = "No currency rate file found.";

var revenuePerApp = {
  processFile : function(filePath){
    fs.readFile(filePath, 'utf8', function (err,data) {
        nbFilesProcessed++;
        if (err) {
          return console.log(err);
        }
        var fileNameCountryCode = filePath.substring(filePath.length-6, filePath.length-4);
        //Transform text to an array of lines
        var arrayOfLines = revenuePerApp.getArrayOfLines(data);
        var line = "";
        var arrayOfStrings = [];
        var app_LocalCurrencyShareMap = {};

        if (filePath.toUpperCase().indexOf("currency_rate".toUpperCase())>-1) {
          currencyRateFileFound = true;
          //Currency rate loading
          for (var i = 0; i < arrayOfLines.length; i++) {
              line = arrayOfLines[i];
              arrayOfStrings = line.split(";");
              currencyCode_currencyRate[arrayOfStrings[0]] = parseFloat(arrayOfStrings[1]);
              //Special case : Withholding tax and beginning balance
              if (arrayOfStrings.length>2) {
                if (arrayOfStrings[2]!="") {
                    withholdingTaxMap[arrayOfStrings[0]] = arrayOfStrings[2];
                }
                if (arrayOfStrings.length==4 && arrayOfStrings[3]!="") {
                  beginningBalanceMap[arrayOfStrings[0]] = arrayOfStrings[3];
                }
              }
          }

        } else {
          //Read earnings files
          var header = "";
          var appName = "";
          var extendedPartnerShare = 0;
          var localCurrencyCode = "";

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
                if (app_LocalCurrencyShareMap.hasOwnProperty(appName)) {
                  // console.log(appName+" deja dans la map");
                  app_LocalCurrencyShareMap[appName] = parseFloat(app_LocalCurrencyShareMap[appName]) + parseFloat(extendedPartnerShare);
                  // console.log("nouvelle valeur = "+app_LocalCurrencyShareMap[appName]);
                } else {
                  app_LocalCurrencyShareMap[appName] = extendedPartnerShare;
                }
                console.log(localCurrencyCode + " " + appName + " " + app_LocalCurrencyShareMap[appName]);
              }
            }
          }

          //Special case of USD-ROW
          if (localCurrencyCode==="USD" && fileNameCountryCode!=="US") {
            localCurrencyCode = "USD-ROW";
          }

          if (withholdingTaxMap!={} || beginningBalanceMap!={}) {
            for (var appName in app_LocalCurrencyShareMap) {
              if (app_LocalCurrencyShareMap.hasOwnProperty(appName)) {
                //Withholding tax
                if (withholdingTaxMap!={} && withholdingTaxMap.hasOwnProperty(localCurrencyCode)){
                  app_LocalCurrencyShareMap[appName] = app_LocalCurrencyShareMap[appName] + parseFloat(withholdingTaxMap[localCurrencyCode]);
                  console.log("Withholding tax : "+app_LocalCurrencyShareMap[appName]);
                }
                //beginning balance
                if (beginningBalanceMap!={} && beginningBalanceMap.hasOwnProperty(localCurrencyCode)){
                  app_LocalCurrencyShareMap[appName] = app_LocalCurrencyShareMap[appName] + parseFloat(beginningBalanceMap[localCurrencyCode]);
                  console.log("Beginning balance : "+app_LocalCurrencyShareMap[appName]);
                }
              }
              //Do tax or balance only on the 1st element
              break;
            }
          }

          //Store apps total shares in local currency in global map
          currencyCode_AppLocalCurrency[localCurrencyCode] = app_LocalCurrencyShareMap;
        }

        //Currency rates are necessary for the rest of the calculation
        if (nbFiles==nbFilesProcessed) {
          if (currencyCode_currencyRate!=={}) {
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
            var totalRevenue = 0;
            var revenueOfOneApp = 0;
            for (var appName in app_TargetedCurrencyTotal) {
              if (app_TargetedCurrencyTotal.hasOwnProperty(appName)) {
                revenueOfOneApp = parseFloat(app_TargetedCurrencyTotal[appName]);
                //Round up at 2 decimals
                revenueOfOneApp = Math.round(revenueOfOneApp * 100)/100;
                resultsText = resultsText + appName + " : " + revenueOfOneApp + "</BR>";
                totalRevenue = Math.round((parseFloat(totalRevenue) + parseFloat(revenueOfOneApp)) * 100)/100;
              }
            }
            resultsText = resultsText + "<p>Total Revenue For This Month : " + totalRevenue + "</p>"
            document.getElementById("results").innerHTML = resultsText;
            document.getElementById("results").style.display = 'block';
            console.log(currencyCode_AppTargetedCurrency);
            console.log(app_TargetedCurrencyTotal);

            revenuePerApp.resetMaps();
          } else {
            document.getElementById("results").innerHTML = NO_CURRENCY_RATE_FILE_FOUND;
            document.getElementById("results").style.display = 'block';
          }
        }
    });
  },

  resetMaps : function(){
    currencyRateFileFound = false;
    nbFiles = 0;
    nbFilesProcessed = 0;
    currencyCode_AppLocalCurrency = {};
    currencyCode_AppTargetedCurrency = {};
    currencyCode_currencyRate = {};
    app_TargetedCurrencyTotal = {};

    beginningBalanceMap = {};
    withholdingTaxMap = {};
  },

  getArrayOfLines : function(wholeText){
    var arrayOfLines = wholeText.match(/[^\r\n]+/g);
    return arrayOfLines;
  }
};
