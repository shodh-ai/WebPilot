import fs from 'fs';
import path from 'path';

export default function getAllRoutes(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllRoutes(file));
    } else {
      results.push(file);
    }
  });
  return results;
}
