# download-github

> Download directory from a GitHub repo.

## Usage

```bash
npm install dgh
```

```js
import dgh from 'dgh';

dgh({
  owner: 'lencx',
  repo: 'download-github',
  name: 'test-dgh',
  // ref: 'HEAD', // default
});
```

```js
/* *** repo subdir & file overwrite *** */

import dgh from 'dgh';

dgh({
  owner: 'lencx',
  repo: 'download-github',
  name: 'test-dgh',
  // ref: 'HEAD', // default
  subdir: 'src',
  overwrite: (file) => {
    if (/\/utils.ts$/.test(file)) {
      fs.appendFileSync(file, `\nexport const DGH = 'DGH'\n`);
    }
  },
});
```

### Options

| Options     | Required | Description                            |
| ----------- | :------: | -------------------------------------- |
| `owner`     |    Y     | github username or organization        |
| `repo`      |    Y     | github repository                      |
| `name`      |    Y     | app name                               |
| `ref`       |    N     | github branch, default `HEAD`          |
| `subdir`    |    N     | repository subdirectory                |
| `overwrite` |    N     | rewrite file content, `(file) => void` |

## Cli

```bash
npm install -g dgh
```

## Command Args

| Args             | Required | Description                     |
| ---------------- | :------: | ------------------------------- |
| `-h` or `--help` |          | dgh command help                |
| `--owner`        |    Y     | github username or organization |
| `--repo`         |    Y     | github repository               |
| `--name`         |    Y     | app name                        |
| `--ref`          |    N     | github branch, default `HEAD`   |
| `--subdir`       |    N     | repository subdirectory         |
