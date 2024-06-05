const zipStaticFolders = require("./config/zipStaticFolders")

module.exports = function (eleventyConfig) {

    zipStaticFolders("static_folders");

	// Output directory: _site

	// Copy `static/` to `_site/static`
    eleventyConfig.addPassthroughCopy("static");
    
    // Emulate passthrough copy during "--serve"
    eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
};