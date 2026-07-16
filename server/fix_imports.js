import fs from "fs";
import path from "path";

function walkDir(dir) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walkDir(dirPath);
    } else if (f.endsWith(".js")) {
      let content = fs.readFileSync(dirPath, "utf8");
      let modified = content.replace(
        /from\s+['"](\.[^'"]+)['"]/g,
        (match, p1) => {
          if (!p1.endsWith(".js")) return `from '${p1}.js'`;
          return match;
        },
      );
      // Also handle dynamic imports and requires just in case, though not strictly needed here
      modified = modified.replace(
        /import\s*\(['"](\.[^'"]+)['"]\)/g,
        (match, p1) => {
          if (!p1.endsWith(".js")) return `import('${p1}.js')`;
          return match;
        },
      );
      fs.writeFileSync(dirPath, modified);
    }
  });
}
walkDir("./engine");
console.log("Fixed imports in engine/*.js files.");
