import * as fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import readdir from 'recursive-readdir';

interface IDependencies {
  dependencies?: object;
  devDependencies?: object;
}

function acceptOnlyJSON(file: string, stats: fs.Stats) {
  return (
    path.basename(file) === 'node_modules' ||
    path.basename(file) === '.git' ||
    path.basename(file) === 'dist' ||
    path.basename(file) === 'build'
  );
}
const walk = async (path: string): Promise<string[]> => {
  return await readdir(path, [acceptOnlyJSON]);
};

const readFile = promisify(fs.readFile);

const readPackage = async (filePath: string): Promise<string> => {
  return await readFile(filePath, 'utf-8');
};
const extractDeps = (
  packageJson: string,
): IDependencies => {
  const { dependencies, devDependencies } = JSON.parse(packageJson);
  if (dependencies && devDependencies) {
    return {
      dependencies,
      devDependencies,
    };
  }
  return {};
};

const countDeps = async (
  packages: Promise<string>[],
): Promise<Map<string, number>> => {
  const results: Map<string, number> = new Map();
  for (const file of packages) {
    const obj = extractDeps(await file);
    // Merging deps and devDeps in 1 object
    const mergedDepsObj: { [key: string]: string } = Object.values(obj).reduce((prev: Partial<IDependencies>, curr: Partial<IDependencies>) => {
      return { ...prev, ...curr };
    }, {});
    Object.keys(mergedDepsObj).forEach((key: string) => {
      // @ts-ignore
      results.has(key) ? results.set(key, results.get(key) + 1) : results.set(key, 0);
    })
  };
  return results;
};

// Sort Map in ASC order by its values
const orderDepsASC = (map: Map<string, number>): Map<string, number> => {
  return new Map([...map].sort((a: [string, number], b: [string, number]) => a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1));
}

(async () => {
  const files = await walk('./');
  const packages = files
    .filter((fileName: string) => path.basename(fileName) === 'package.json')
    .map(readPackage);
  console.log(orderDepsASC(await countDeps(packages)));
})();
