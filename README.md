# Sveltelette

CLI tool for simplifying development of small Svelte apps

## Overview

Let's say you have a folder full of `.svelte` files and you want to turn each one
into an `.html` document. There wasn't really a good way to do it. There still
isn't, but now there is an OK way to do it.

## Installation

```bash
npm install -g sveltelette
```

## Usage

When inside the folder you want to compile, just run:

```bash
sveltelette
```

Press q to stop the server.

### Example

```
$ ls
foo.svelte bar/baz.svelte

$ sveltelette
Starting server on port 8080
Server started. Press q to quit
```

In a web browser, go to http://localhost:8080/foo.html or 
http://localhost:8080/bar/baz.html to see the result.

### Configuration

`$ sveltelette [-p PORT] [COMMAND]`

`-p or --port`: Server port (default `8080`)

`COMMAND`: either `build` (compiles the files into static files) or `serve` 
(runs the development server) (default `serve`)


## Motivation

I am not a web developer, but I make a lot of small websites for helping with simple tasks.
I have never found a framework or tool that really felt like it fit into the way that
I like to write and organize my code.

When I first encountered Svelte, I liked the way it looked, but quickly became frustrated
trying to use it. It seems like it was mainly designed for single-page apps, which is not
what I like to make. SvelteKit seemed like the solution at first, but the thought of an
editor where every single file is named `+page.svelte` quickly ended that.

Maybe someone else has a brain that works like mine. Shoutout to 
[ric2b on reddit](https://old.reddit.com/r/sveltejs/comments/gli0iq/multipage_apps_with_svelte_or_how_to_have/) 
for being the only other person that I could find that had a similar problem.
