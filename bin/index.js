#! /usr/bin/env node

import { defineConfig, build, createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { promisify } from 'util';
import { exec } from 'child_process';
import * as readline from 'node:readline';

readline.emitKeypressEvents(process.stdin);

var npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

var myExec = promisify(exec);

import path from 'path'
import fs from 'fs'

const FILE_REGEX = /(.*)\.svelte$/

let htmlFiles = [];

async function runSveltelette() {
  try {
    await fs.promises.rm(".sveltelette", {recursive: true});
  } catch (e) {
    console.debug(".sveltelette didn't exist");
  }
  
  await createHtmlFiles(".");
  await installSvelte();
  
  let server = await createServer({
    appType: 'mpa',
    plugins: [svelte()],
    root: path.join(process.cwd(), ".sveltelette"),
    build: {
      rollupOptions: {
        input: htmlFiles
      }
    }
  });
  
  console.log("Starting server on port 8080")
  await server.listen(8080)
  
  console.log("Server started. Press q to quit")
  
  if (process.stdin.isTTY)
    process.stdin.setRawMode(true);

  process.stdin.on('keypress', async (chunk, key) => {
    if (key && key.name == 'q'){
      console.log("Server closing...");
      await server.close();
      process.exit(0);
    }
  });
}

async function installSvelte() {
  console.debug("Running `npm init -y`");
  await myExec(npm + ' init -y');
  console.debug("Running `npm install svelte`")
  await myExec(npm + ' install svelte');
}

async function createHtmlFiles(dir) {
  let files = await fs.promises.readdir(dir);

  for (const file of files) {
    let match = FILE_REGEX.exec(file);
    const fromPath = path.posix.join(dir, file);
    const stat = await fs.promises.stat(fromPath);

    if (match) {
      const toPath = path.posix.join(".sveltelette", dir, match[1] + ".html");
      const toJsPath = path.posix.join(".sveltelette", dir, match[1] + ".js");
      await fs.promises.mkdir(path.posix.join(".sveltelette", dir), { recursive: true })

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">

<head>
  <script type="module" src="${match[1]}.js"></script>
</head>

<body id="app">
</body>

</html>  
      `

      htmlFiles.push(toPath);
      await fs.promises.writeFile(toPath, htmlContent);
      const relativePathToSvelteFromJs = path.posix.relative(path.posix.join(".sveltelette", dir), fromPath);

      const jsContents = `
import App from '${relativePathToSvelteFromJs}'

const app = new App({
  target: document.getElementById('app'),
})

export default app
      `

      await fs.promises.writeFile(toJsPath, jsContents);
      
    } else if (stat.isDirectory() && file != ".sveltelette" && file != "node_modules") {
      createHtmlFiles(fromPath)
    }
  }

}

runSveltelette();
