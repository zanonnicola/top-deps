import * as fs from "fs";
import path from 'path';
import readdir from 'recursive-readdir';

function acceptOnlyJSON(file: string, stats: fs.Stats) {
  return path.basename(file) === 'node_modules' || path.basename(file) === '.git';
}
const walk = async (path: string): Promise<string[]> => {
  return await readdir(path, [acceptOnlyJSON]);
}

try {
  (async () => {
    const hrstart: [number, number] = process.hrtime()
    const files = await walk('../');
    console.log(files.filter((fileName:string) => path.basename(fileName) === 'package.json'));
    const hrend: [number, number] = process.hrtime(hrstart);
    console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000);
  })();
} catch (error) {
  console.log('Error: ', error);
}
