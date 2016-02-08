# RevenuePerApp
This program allows you to know for each app put on the Apple AppStore how much they earned. On iTunesConnect I couldn't find reports about my earnings per app but only earnings per currency.

The program is composed of **Index.html** and **revenuePerApp.js**, they both have to run on a **NodeJS server**.

##To Use

Create a file containing the **currency rates** related to your earnings (rates given at iTunesConnect->Payments and financial reports-> payments, this file name must contain "currency_rate") and drop it with your **earnings reports** (from iTunesConnect->Payments and financial reports-> earnings) in the browser window displaying index.html.

My suggestion to get an easy Node.JS server up and running as a desktop app (using **Electron**):
```
# Clone RevenuePerApp repository
git clone https://github.com/est-seb/RevenuePerApp
# Clone electron-quick-start repository
git clone https://github.com/atom/electron-quick-start
# Go into the repository
cd electron-quick-start
# Install dependencies and run the app
npm install
# Copy the content of this repository
cp ../RevenuePerApp/index.html ../RevenuePerApp/revenuePerApp.js .
# Run electron
npm start
```
