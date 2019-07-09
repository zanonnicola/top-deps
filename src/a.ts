import * as fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import readdir from 'recursive-readdir';

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
): { dependencies?: object; devDependencies?: object } => {
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
  const results = new Map();
  for (const file of packages) {
    const obj = extractDeps(await file);
    console.log(
      Object.values(obj).reduce((prev, curr) => {
        return { ...prev, ...curr };
      }),
    );
  }
  return results;
};

(async () => {
  const files = await walk('./');
  const packages = files
    .filter((fileName: string) => path.basename(fileName) === 'package.json')
    .map(readPackage);
  await countDeps(packages);
})();
