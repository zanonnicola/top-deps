#! /usr/bin/env node

import * as fs from "fs";
import path from 'path';
import readdir from 'recursive-readdir';
import meow from 'meow';
import Listr from 'listr';
import chalk from 'chalk';

function acceptOnlyJSON(file: string, stats: fs.Stats) {
  return path.basename(file) === 'node_modules' || path.basename(file) === '.git' || path.basename(file) === 'dist' || path.basename(file) === 'build';
}
const walk = async (path: string): Promise<string[]> => {
  return await readdir(path, [acceptOnlyJSON]);
}

interface IContext {
  packages: string[];
  hrstart: [number, number];
  time: ITime
}
interface ITime {
  s: number;
  ms: number
}

const cli = meow(`
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
`, {
    flags: {
      limit: {
        type: 'string',
        alias: 'l'
      }
    }
  }
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
          const hrstart: [number, number] = process.hrtime()
          const files = await walk(args.input[0])
          ctx.packages = files.filter((fileName: string) => path.basename(fileName) === 'package.json');
          ctx.hrstart = hrstart;
        } catch (error) {
          throw new Error(error);
        }
      }
    },
    {
      title: 'Counting',
      task: (ctx: IContext) => {
        const hrend: [number, number] = process.hrtime(ctx.hrstart);
        ctx.time = {
          s: hrend[0],
          ms: hrend[1] / 1000000
        }
        Promise.resolve(ctx);
      }
    }
  ]);
  tasks.run().then(({ packages, time }: { packages: string[], time: ITime }) => {
    console.log(`
    ${chalk.bold('Number of files found')}: ${chalk.green('' + packages.length)}
    ${chalk.bold('Time')}: ${chalk.green(time.s + 's')}, ${chalk.green(time.ms + 'ms')}
    `);
  }).catch((error: Error) => {
    console.error(chalk.white.bgRed('Error:'), error.message);
  });
}

run(cli);
