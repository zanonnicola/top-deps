#! /usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import readdir from 'recursive-readdir';
import meow from 'meow';
import Listr from 'listr';
import chalk from 'chalk';

interface IDependencies {
  dependencies?: object;
  devDependencies?: object;
}

interface IContext {
  packages: string[];
  hrstart: [number, number];
  orderedPackages: Map<string, number>
  time: ITime;
}

interface ITime {
  s: number;
  ms: number;
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

const cli = meow(
  `
    Usage
    $ top-deps <folder path>

    Options
      --limit, -l  limit number of rows displayed (default 5)

      Other options:
      -h, --help         show usage information
      -v, --version      print version info and exit

    Examples
      $ top-deps ./ --limit 3
      1, 2, 3
`,
  {
    flags: {
      limit: {
        type: 'string',
        alias: 'l',
      },
    },
  },
);

if (cli.input.length === 0) {
  console.error(chalk.white.bgRed.bold('Error:'), 'Specify a folder path');
  process.exit(1);
}

function run(args: meow.Result) {
  console.log(args.input, args.flags);
  const tasks: Listr = new Listr([
    {
      title: 'Scanning current folder',
      task: async (ctx: IContext) => {
        try {
          const hrstart: [number, number] = process.hrtime();
          const files = await walk(args.input[0]);
          ctx.packages = files.filter(
            (fileName: string) => path.basename(fileName) === 'package.json',
          );
          ctx.hrstart = hrstart;
        } catch (error) {
          throw new Error(error);
        }
      },
    },
    {
      title: 'Counting',
      task: async (ctx: IContext) => {
        const packages = ctx.packages
          .filter((fileName: string) => path.basename(fileName) === 'package.json')
          .map(readPackage);
        ctx.orderedPackages = orderDepsASC(await countDeps(packages));
        const hrend: [number, number] = process.hrtime(ctx.hrstart);
        ctx.time = {
          s: hrend[0],
          ms: hrend[1] / 1000000,
        };
        Promise.resolve(ctx);
      },
    },
  ]);
  tasks
    .run()
    .then(({ orderedPackages, time }: { orderedPackages: Map<string, number>; time: ITime }) => {
      console.log(`
    ${chalk.bold('Number of files found')}: ${chalk.green('' + orderedPackages.size)}
    ${chalk.bold('Time')}: ${chalk.green(time.s + 's')}, ${chalk.green(
        time.ms + 'ms',
      )}
    `);
    })
    .catch((error: Error) => {
      console.error(chalk.white.bgRed('Error:'), error.message);
    });
}

run(cli);
