#!/usr/bin/env node
const fs = require('fs');

function genLesson(cfg) {
    const filename = cfg.id.replace(/^python-/, '');
    const path = `content/python/${filename}.json`;
    fs.writeFileSync(path, JSON.stringify(cfg, null, 2), 'utf8');
    console.log('Written: ' + path);
}

module.exports = { genLesson };
