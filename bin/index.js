#! /usr/bin/env node


import { defineConfig, build, createServer } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'
import fs from 'fs'

const FILE_REGEX = /(.*)\.svelte$/

let htmlFiles = [];

async function runSveltelette() {
  // await fs.promises.rm(".sveltelette", {recursive: true});
  await createHtmlFiles(".");
  
  build({
    appType: 'mpa',
    plugins: [svelte()],
    root: path.join(process.cwd(), ".sveltelette"),
    build: {
      rollupOptions: {
        input: htmlFiles
      }
    }
  });
}

async function createHtmlFiles(dir) {
  let files = await fs.promises.readdir(dir);

  for (const file of files) {
    let match = FILE_REGEX.exec(file);
    const htmlPath = path.posix.join("default.html");
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
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vite + Svelte</title>
</head>

<body>
  <div id="app"></div>
  <script type="module" src="${match[1]}.js"></script>
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


