Demo for Alice's Adventures in Wonderland, by Lewis Carroll
====

Using CSS Shapes to enhance visual storytelling.

__UPDATE August 2014:__

__The full demo is obsolete because the `shape-inside` property was removed from browser implementations of CSS Shapes. What remains here is only a redux of the original demo. It demonstrates just one use-case with the `shape-outside` property.__


The original source still exists in the [archive](https://github.com/adobe-webplatform/Demo-for-Alice-s-Adventures-in-Wonderland/releases/tag/archive) tag. Use an [old Chromium build](http://commondatastorage.googleapis.com/chromium-browser-continuous/index.html?prefix=Mac/230051/) and enable _experimental Web Platform features_ in `chrome://flags` to run the demo.

There is a [video recording](https://www.youtube.com/watch?v=VON2shFlsKU) of the original demo.

See "[Using CSS Shapes to Enhance Visual Storytelling](http://blogs.adobe.com/webplatform/2013/10/23/css-shapes-visual-storytelling/)" to learn more about the project.

Demo
---

Requirements:

- Use [Google Chrome](https://www.google.com/intl/en/chrome/browser/).
- If you're using Chrome version 36 or below (see `chrome://version`), enable the flags to support CSS Shapes. [Learn how](http://html.adobe.com/webplatform/enable/).


Contributing
---

You'll need:
- [Node.JS](http://nodejs.org/)
- [SASS](http://sass-lang.com/)
- [grunt](http://gruntjs.com/)

Clone repo and change to directory:

    git clone https://github.com/adobe-webplatform/alice.git

Install dependencies defined in package.json:

    npm install

Watch for changes:

    grunt watch

CSS files are overwritten by SASS with source from `.scss` files. Do not edit `.css` files directly.

License
---

All code is offered under the [Apache License Version 2.0](http://www.apache.org/licenses/LICENSE-2.0). For licenses on third-party libraries used see [NOTICE](./NOTICE) file.

All assets are offered under the [Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license](http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US).
