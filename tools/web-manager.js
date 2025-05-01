const https = require('https');
const http = require('http');
const fs = require('fs');
const url = require('url');

class WebManager {
  fetchPage(pageUrl, callback) {
    const parsed = url.parse(pageUrl);
    const mod = parsed.protocol === 'https:' ? https : http;
    mod.get(pageUrl, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => callback(null, data));
    }).on('error', err => callback(err));
  }

  fetchAndSave(pageUrl, filePath, callback) {
    this.fetchPage(pageUrl, (err, data) => {
      if (err) return callback(err);
      fs.writeFile(filePath, data, 'utf8', callback);
    });
  }
}

module.exports = new WebManager();
