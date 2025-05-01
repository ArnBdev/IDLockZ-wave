const fs = require('fs');
const path = require('path');

class FileManager {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  resolve(p) {
    return path.resolve(this.baseDir, p);
  }

  readFile(relPath) {
    return fs.readFileSync(this.resolve(relPath), 'utf8');
  }

  writeFile(relPath, content) {
    fs.writeFileSync(this.resolve(relPath), content, 'utf8');
  }

  listFiles(relDir = '.') {
    return fs.readdirSync(this.resolve(relDir));
  }

  deleteFile(relPath) {
    fs.unlinkSync(this.resolve(relPath));
  }
}

module.exports = new FileManager();
