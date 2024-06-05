---
title: Serving zipped git directories with 11ty
---

Welcome to my first blog post on jameskerrane.com! Today, I'd like to share a feature I added to the site while building its blog.

As I've been working through Apple's [Develop in Swift Tutorials](https://developer.apple.com/tutorials/develop-in-swift), I've also been [sharing my projects on this site's new blog section](/blog/explorations-with-swift). I wanted a simple way to include download links for my project files on the site and keep them synced with my git repository for each project.

**Note:** This setup is experimental and is more of an experiment than a guide to best practices.

## Syncing git repos we want to zip with the website

To include our git projects on the website and zip them with the site build, we'll utilize Git's [submodules feature](https://www.git-scm.com/book/en/v2/Git-Tools-Submodules), which allows us to include one project inside another.

From the root of our 11ty, website, we'll create a new folder for the projects we want to include and add the projects with git:

```bash
$ mkdir static_folders
$ cd static_folders
$ git submodule add https://github.com/thatrobotdev/ChatPrototype
...
$ git submodule add https://github.com/thatrobotdev/MyselfInSixWords
...
$ git submodule add https://github.com/thatrobotdev/OnboardingFlow
...
```

## Zipping Projects with Node.js

Next, we'll use the Node.js File System API along with a package called node-archiver to zip each project in the "static_folders" directory to a new folder called "static" during the site build.

For this, create a new [CommonJS module](https://nodejs.org/api/modules.html#modules-commonjs-modules) at `config/zipStaticFolders.js` to hold our function for zipping directories.

`config/zipStaticFolders.js`

```js
module.exports = function zipStaticFolders() {
    // Inport required modules
    const fs = require('fs');
    const path = require('path');
    const archiver = require('archiver');

    const inputFolderPath = path.resolve("static_folders");
    const outputFolderPath = path.resolve("static");

    // Read static folders
    const results = fs.readdirSync(inputFolderPath);

    // Get all folders inside static folders
    const folders = results.filter(res => fs.lstatSync(path.resolve(inputFolderPath, res)).isDirectory());

    // Create a .zip file for each static folder
    folders.forEach(folder => {
        // Create a file to stream archive data to.
        try {
            if (!fs.existsSync(outputFolderPath)) {
                fs.mkdirSync(outputFolderPath);
            }
        } catch (err) {
            console.error(err);
        }
        const output = fs.createWriteStream(`${outputFolderPath}/${folder}.zip`);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // Listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        output.on('close', function () {
            console.log(`[zipStaticDirectories] Zipped ${inputFolderPath}/${folder} to ${outputFolderPath}/${folder}.zip (${archive.pointer()} total bytes)`);
        });

        // Catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function (err) {
            if (err.code === 'ENOENT') {
                // log warning
            } else {
                // throw error
                throw err;
            }
        });

        // Catch this error explicitly
        archive.on('error', function (err) {
            throw err;
        });

        // Pipe archive data to the file
        archive.pipe(output);

        // Add the archive to the zip
        archive.directory(`${inputFolderPath}/${folder}/`, false)

        // Finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        archive.finalize();
    });
}
```

Now, we can import our zipStaticFolders function in the `.eleventy.js` config file so that it runs when the site builds!

`.eleventy.js`

```js
const zipStaticFolders = require("./config/zipStaticFolders")

module.exports = function (eleventyConfig) {
    zipStaticFolders();
};
```

## Copying Zipped Files with 11ty

During the 11ty's site's build step, we'll use [11ty's Passthrough File Copy](https://www.11ty.dev/docs/copy/) feature to copy the generated .zip files to the site.

`.eleventy.js`

```js
module.exports = function (eleventyConfig) {
    zipStaticFolders();

    // Output directory: _site

    // Copy `static/` to `_site/static`
    eleventyConfig.addPassthroughCopy("static");
    
    // Emulate passthrough copy during "--serve"
    eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
};
```

And, we're done! Hopefully you found this experiment interesting. I bet there are many easier ways to do this, but for a 2-hour hack, it seems to be working well! :) Thanks for reading!
