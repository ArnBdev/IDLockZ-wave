const https = require('https');

const BASE_URL = 'https://developer.athom.com/api';
const [,, command, ...args] = process.argv;

function fetchAPI(path, cb) {
  https.get(BASE_URL + path, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        cb(null, JSON.parse(data));
      } catch (e) {
        cb(e);
      }
    });
  }).on('error', err => cb(err));
}

switch (command) {
  case 'capabilities': {
    fetchAPI('/capabilities', (err, data) => {
      if (err) return console.error('Feil ved henting:', err.message);
      console.log(JSON.stringify(data, null, 2));
    });
    break;
  }
  case 'flows': {
    fetchAPI('/flows', (err, data) => {
      if (err) return console.error('Feil ved henting:', err.message);
      console.log(JSON.stringify(data, null, 2));
    });
    break;
  }
  case 'devices': {
    fetchAPI('/devices', (err, data) => {
      if (err) return console.error('Feil ved henting:', err.message);
      console.log(JSON.stringify(data, null, 2));
    });
    break;
  }
  default:
    console.log(`Bruk:\n  node homey-api-cli.js capabilities\n  node homey-api-cli.js flows\n  node homey-api-cli.js devices`);
}
