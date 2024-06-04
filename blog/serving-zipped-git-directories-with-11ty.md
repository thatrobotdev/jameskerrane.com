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

`.eleventy.js`

```js
function zipStaticFolders(folderPathName) {
    // Import required modules
    const fs = require('fs');
    const path = require('path');
    const archiver = require('archiver');

    const folderPath = path.resolve(__dirname, folderPathName);

    // Read static folders
    const results = fs.readdirSync(folderPath);

    // Get all folders inside static folders
    const folders = results.filter(res => fs.lstatSync(path.resolve(folderPath, res)).isDirectory());

    // Create a .zip file for each static folder
    folders.forEach(folder => {
        // Create a file to stream archive data to.
        const output = fs.createWriteStream(__dirname + `/static/${folder}.zip`);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Set compression level
        });

        // Configure archive settings...

        // Pipe archive data to the file
        archive.pipe(output);

        // Add the archive to the zip
        archive.directory(`${folderPathName}/${folder}/`, false)

        // Finalise the archive
        archive.finalize();
    });
}

// Run zipStaticFolders while building site
module.exports = function (eleventyConfig) {
    zipStaticFolders("static_folders");
};
```

## Copying Zipped Files with 11ty

During the 11ty's site's build step, we'll use [11ty's Passthrough File Copy](https://www.11ty.dev/docs/copy/) feature to copy the generated .zip files to the site.

`.eleventy.js`

```js
module.exports = function (eleventyConfig) {
    zipStaticFolders("static_folders");

    // Output directory: _site

    // Copy `static/` to `_site/static`
    eleventyConfig.addPassthroughCopy("static");
    
    // Emulate passthrough copy during "--serve"
    eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
};
```

And, we're done! Hopefully you found this experiment interesting. I bet there are many easier ways to do this, but for a 2-hour hack, it seems to be working well! :) Thanks for reading!
