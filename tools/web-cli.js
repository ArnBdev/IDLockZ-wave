#!/usr/bin/env node

const webManager = require('./web-manager');
const [,, command, ...args] = process.argv;

switch (command) {
  case 'fetch': {
    const [url] = args;
    if (!url) return console.error('Bruk: web-cli.js fetch <url>');
    webManager.fetchPage(url, (err, data) => {
      if (err) return console.error('Feil ved henting:', err.message);
      console.log(data);
    });
    break;
  }
  case 'save': {
    const [url, file] = args;
    if (!url || !file) return console.error('Bruk: web-cli.js save <url> <fil>');
    webManager.fetchAndSave(url, file, err => {
      if (err) return console.error('Feil ved lagring:', err.message);
      console.log('Lagret innhold fra', url, 'til', file);
    });
    break;
  }
  default:
    console.log(`Bruk:\n  node web-cli.js fetch <url>\n  node web-cli.js save <url> <fil>`);
}
