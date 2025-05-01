const fs = require('fs');
const path = require('path');

class SearchManager {
  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  resolve(p) {
    return path.resolve(this.baseDir, p);
  }

  searchInFile(relPath, query) {
    const filePath = this.resolve(relPath);
    if (!fs.existsSync(filePath)) return [];
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    return lines
      .map((line, idx) => ({ line, lineNumber: idx + 1 }))
      .filter(obj => obj.line.includes(query));
  }

  searchInDir(relDir, query, exts = ['.js', '.json', '.md']) {
    const dirPath = this.resolve(relDir);
    let results = [];
    fs.readdirSync(dirPath).forEach(file => {
      const fullPath = path.join(dirPath, file);
      if (fs.statSync(fullPath).isDirectory()) {
        results = results.concat(this.searchInDir(path.join(relDir, file), query, exts));
      } else if (exts.includes(path.extname(file))) {
        const found = this.searchInFile(path.join(relDir, file), query);
        if (found.length > 0) {
          results.push({ file: path.join(relDir, file), matches: found });
        }
      }
    });
    return results;
  }
}

module.exports = new SearchManager();
