import klaw from 'klaw';
import through2 from 'through2';
import  path from 'path';

const excludeModulesDirs = through2.obj(function (item: klaw.Item, enc: string, next: through2.TransformCallback) {
  const dirName: string = path.dirname(item.path);
  if (!dirName.includes('node_modules')) {
    this.push(item);
  }
  next();
});

const extractPackageJSON = through2.obj(function (item: klaw.Item, _, next: through2.TransformCallback) {
  const fileName: string = path.basename(item.path);
  if (fileName === 'package.json') {
    this.push(item);
  }
  next();
});

const items: klaw.Item[] = [];
klaw('../', {depthLimit: 2})
.pipe(excludeModulesDirs)
.pipe(extractPackageJSON)
.on('data', (item: klaw.Item) => {
  console.log(item.path);
  items.push(item)
})
.on('end', () => console.log(items.length));




