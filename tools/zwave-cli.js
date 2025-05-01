const https = require('https');

const ZWAVE_DOCS = 'https://www.zwave-js.io/docs/supported-command-classes.json';
const [,, command, ...args] = process.argv;

function fetchZWaveDocs(cb) {
  https.get(ZWAVE_DOCS, res => {
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
  case 'list': {
    fetchZWaveDocs((err, data) => {
      if (err) return console.error('Feil ved henting:', err.message);
      Object.keys(data).forEach(cc => console.log(cc));
    });
    break;
  }
  case 'info': {
    const [ccName] = args;
    if (!ccName) return console.error('Bruk: zwave-cli.js info <CommandClass>');
    fetchZWaveDocs((err, data) => {
      if (err) return console.error('Feil ved henting:', err.message);
      const cc = data[ccName];
      if (!cc) return console.log('Fant ikke Command Class:', ccName);
      console.log(JSON.stringify(cc, null, 2));
    });
    break;
  }
  default:
    console.log(`Bruk:\n  node zwave-cli.js list\n  node zwave-cli.js info <CommandClass>`);
}
