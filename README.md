[![TypeScript version][ts-badge]][typescript-35]
[![Node.js version][nodejs-badge]][nodejs]

> Count and display the most common used packages in a given directory

## Install

```
$ npm install --global top-deps
```

## Usage

Use current directory as a starting point.

```
$ top-deps --help

  Usage
    $ top-deps <folder path>

    Options
      --limit, -l  limit number of rows displayed (default 3)

      Other options:
      -h, --help         show usage information
      -v, --version      print version info and exit

    Examples
      $ top-deps ./ --limit 3
      ┌───┬──────────────┬───────┐
      │   │ Package Name │ Count │
      ├───┼──────────────┼───────┤
      │ 1 │ react        │ 12    │
      ├───┼──────────────┼───────┤
      │ 2 │ react-dom    │ 12    │
      ├───┼──────────────┼───────┤
      │ 3 │ prettier     │ 9     │
      └───┴──────────────┴───────┘
```
