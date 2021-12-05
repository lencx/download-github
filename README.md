# download-github

> ⬇️ Download directory from a GitHub repo.

## Usage

[![asciicast](https://asciinema.org/a/ahm2Hkp6mKtPfHyFMeZNJhwcV.svg)](https://asciinema.org/a/ahm2Hkp6mKtPfHyFMeZNJhwcV)

```bash
npm install dgh
```

```js
import dgh from "dgh";

dgh({
  owner: "lencx",
  repo: "download-github",
  name: "test-dgh",
  ref: "main", // default `HEAD`
  overwrite: true, // default `true`
  root: "./", // default `process.cwd()`
});
```

```js
/* *** repo subdir & file overwrite *** */

import dgh from "dgh";

dgh({
  owner: "lencx",
  repo: "download-github",
  name: "test-dgh",
  ref: "HEAD", // github branch, default 'HEAD'
  subdir: "src",
})
  .on("info", (msg) => {
    console.log(msg);
  })
  .on("overwrite", (files, fs) => {
    files.forEach((file) => {
      if (/\/utils.ts$/.test(file)) {
        // @see https://github.com/jprichardson/node-fs-extra
        fs.appendFileSync(file, `\nexport const DGH = 'DGH';\n`);
      }
    });
  })
  .on("end", () => {
    console.log("dgh end");
  });
```

### Options

| Options     | Required | Description                          |
| ----------- | :------: | ------------------------------------ |
| `owner`     |    Y     | github username or organization      |
| `repo`      |    Y     | github repository                    |
| `name`      |    Y     | app name                             |
| `root`      |    N     | app path, default `process.cwd()`    |
| `ref`       |    N     | github branch, default `HEAD`        |
| `subdir`    |    N     | repository subdirectory              |
| `overwrite` |    N     | rewrite file content, default `true` |

### Event

- `on('overwrite', (files, fs) => void))` - rewrite file content, the options `overwrite` must be `true`
  - files: all file paths
  - fs: [fs-extra](https://github.com/jprichardson/node-fs-extra) instance
- `on('end', () => void))` - download complete callback event
- `on('info', () => void))` - debug logs

## Cli

```bash
npx dgh \
  --owner=<github_owner> \
  --repo=<github_repo> \
  --name=<app_name> \
  --subdir=<repo_subdir> \
  --root=<app_path>
```

```bash
npm install -g dgh
```

## Command Args

| Args             | Required | Description                       |
| ---------------- | :------: | --------------------------------- |
| `-h` or `--help` |          | dgh command help                  |
| `--owner`        |    Y     | github username or organization   |
| `--repo`         |    Y     | github repository                 |
| `--name`         |    Y     | app name                          |
| `--root`         |    N     | app path, default `process.cwd()` |
| `--ref`          |    N     | github branch, default `HEAD`     |
| `--subdir`       |    N     | repository subdirectory           |

### Examples

```bash
# test command 1
npx dgh \
  --owner=lencx \
  --repo="learn-wasm" \
  --name="dgh-test-download" \
  --root="my/path"
```

```bash
# test command 2
npx dgh \
  --owner=lencx \
  --repo="learn-wasm" \
  --name="dgh-test-download-2" \
  --ref="gh-pages" \
  --root="my/path"
```

```bash
# test command 3
npx dgh \
  --owner=lencx \
  --repo="learn-wasm" \
  --name="dgh-test-download-3" \
  --ref="gh-pages" \
  --subdir="assets" \
  --root="my/path"
```

## Related

- [create-mpl](https://github.com/lencx/create-mpl) - ⚡️ Create a project in seconds!
