#!/usr/bin/env node

const fileManager = require('./file-manager');
const [,, command, ...args] = process.argv;

switch (command) {
  case 'read': {
    const [file] = args;
    if (!file) return console.error('Bruk: file-cli.js read <fil>');
    try {
      const content = fileManager.readFile(file);
      console.log(content);
    } catch (e) {
      console.error('Feil ved lesing:', e.message);
    }
    break;
  }
  case 'write': {
    const [file, ...contentArr] = args;
    if (!file || contentArr.length === 0) return console.error('Bruk: file-cli.js write <fil> <innhold>');
    try {
      fileManager.writeFile(file, contentArr.join(' '));
      console.log('Skrevet til fil:', file);
    } catch (e) {
      console.error('Feil ved skriving:', e.message);
    }
    break;
  }
  case 'list': {
    const [dir] = args;
    try {
      const files = fileManager.listFiles(dir || '.');
      files.forEach(f => console.log(f));
    } catch (e) {
      console.error('Feil ved listing:', e.message);
    }
    break;
  }
  case 'delete': {
    const [file] = args;
    if (!file) return console.error('Bruk: file-cli.js delete <fil>');
    try {
      fileManager.deleteFile(file);
      console.log('Slettet fil:', file);
    } catch (e) {
      console.error('Feil ved sletting:', e.message);
    }
    break;
  }
  default:
    console.log(`Bruk:
  node file-cli.js read <fil>
  node file-cli.js write <fil> <innhold>
  node file-cli.js list [mappe]
  node file-cli.js delete <fil>`);
}