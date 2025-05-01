#!/usr/bin/env node

const searchManager = require('./search-manager');
const [,, command, ...args] = process.argv;

switch (command) {
  case 'file': {
    const [file, ...queryArr] = args;
    if (!file || queryArr.length === 0) return console.error('Bruk: search-cli.js file <fil> <tekst>');
    const query = queryArr.join(' ');
    const results = searchManager.searchInFile(file, query);
    if (results.length === 0) return console.log('Ingen treff.');
    results.forEach(r => console.log(`${file}:${r.lineNumber}: ${r.line}`));
    break;
  }
  case 'dir': {
    const [dir, ...queryArr] = args;
    if (!dir || queryArr.length === 0) return console.error('Bruk: search-cli.js dir <mappe> <tekst>');
    const query = queryArr.join(' ');
    const results = searchManager.searchInDir(dir, query);
    if (results.length === 0) return console.log('Ingen treff.');
    results.forEach(r => {
      r.matches.forEach(m => console.log(`${r.file}:${m.lineNumber}: ${m.line}`));
    });
    break;
  }
  default:
    console.log(`Bruk:
  node search-cli.js file <fil> <tekst>
  node search-cli.js dir <mappe> <tekst>`);
}