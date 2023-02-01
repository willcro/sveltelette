#! /usr/bin/env node

import { build, createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { promisify } from 'util';
import { exec } from 'child_process';
import * as readline from 'node:readline';
import minimist from 'minimist';
import chokidar from 'chokidar';
import path from 'path'
import fs from 'fs'

var argv = minimist(process.argv.slice(2));

readline.emitKeypressEvents(process.stdin);

var npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

var myExec = promisify(exec);

let htmlFiles = [];

async function runSveltelette() {
  try {
    await fs.promises.rm(".sveltelette", { recursive: true });
  } catch (e) {
    console.debug(".sveltelette didn't exist");
  }
  
  let watcher = chokidar.watch(".", {
    ignored: ["node_modules/**", ".sveltelette/**", "package.json", "package-lock.json", "dist/**"]
  });

  watcher
    .on('add', processNewFile);
    
  await new Promise((res, rej) => watcher.on('ready', res));
  // await createHtmlFiles(".");
  await installSvelte();

  if (argv["_"].length > 0) {
    if (argv["_"][0] == "build") {
      await buildApp();
    } else if (argv["_"][0] == "serve") {
      await startServer();
    } else {
      console.error(`Unrecognized command ${argv["_"][0]}`);
      process.exit(2);
    }
  } else {
    // default behavior is to start the development server
    await startServer();
  }
}

async function buildApp() {
  await build({
    appType: 'mpa',
    plugins: [svelte()],
    root: path.join(process.cwd(), ".sveltelette"),
    build: {
      outDir: "../dist",
      rollupOptions: {
        input: htmlFiles
      }
    }
  });
}

async function startServer() {
  let server = await createServer({
    appType: 'mpa',
    plugins: [svelte()],
    root: path.join(process.cwd(), ".sveltelette"),
    server: {
      strictPort: true
    },
    build: {
      rollupOptions: {
        input: htmlFiles
      }
    }
  });

  let port = getPort();
  console.log(`Starting server on port ${port}`)
  await server.listen(port)

  console.log("Server started. Press q to quit")

  if (process.stdin.isTTY)
    process.stdin.setRawMode(true);

  process.stdin.on('keypress', async (chunk, key) => {
    if (key && key.name == 'q') {
      console.log("Server closing...");
      await server.close();
      console.log("When ready to build, run `sveltelette build`");
      process.exit(0);
    }
  });
}

async function installSvelte() {
  if (!(await fileExists("package.json"))) {
    console.debug("Running `npm init -y`");
    await myExec(npm + ' init -y');
  }

  if (!(await packageJsonContainsSvelte())) {
    console.debug("Running `npm install svelte`")
    await myExec(npm + ' install svelte');
  }
}

async function fileExists(filename) {
  return fs.promises.access(filename).then(it => true).catch(it => false);
}

async function packageJsonContainsSvelte() {
  const fileContents = await fs.promises.readFile("package.json");
  try {
    const packageJson = JSON.parse(fileContents);
    return packageJson.devDependencies && packageJson.devDependencies["svelte"];
  } catch (ex) {
    console.error("Error occurred while parsing package.json", ex);
    process.exit(1);
  }
}

async function processNewSvelteFile(file) {
  let filePath = path.posix.parse(file);
  let name = filePath.name;
  let dir = filePath.dir;
  
  const toPath = path.posix.join(".sveltelette", dir, name + ".html");
  const toJsPath = path.posix.join(".sveltelette", dir, name + ".js");
  await fs.promises.mkdir(path.posix.join(".sveltelette", dir), { recursive: true })

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">

<head>
  <script type="module" src="${name}.js"></script>
</head>

<body id="app">
</body>

</html>  
      `

  htmlFiles.push(toPath);
  await fs.promises.writeFile(toPath, htmlContent);
  const relativePathToSvelteFromJs = path.posix.relative(path.posix.join(".sveltelette", dir), file);

  const jsContents = `
import App from '${relativePathToSvelteFromJs}'

const app = new App({
  target: document.getElementById('app'),
})

export default app
      `

  await fs.promises.writeFile(toJsPath, jsContents);
}

async function processNewFile(file) {
  let posixPath = file.split(path.sep).join(path.posix.sep);
  let filePath = path.parse(posixPath);
  if (filePath.ext == ".svelte") {
    return processNewSvelteFile(posixPath);
  }
  
  // todo: handle non-svelte files
}

function getPort() {
  if (argv["port"]) {
    return argv["port"];
  }

  if (argv["p"]) {
    return argv["p"];
  }

  return 8080;
}

runSveltelette();
