const { buildApp } = require('./src/app');

async function test() {
    try {
        const app = await buildApp();
        console.log("App built successfully");
    } catch (err) {
        const fs = require('fs');
        fs.writeFileSync('error_dump.txt', err.message || JSON.stringify(err));
        console.error("Dumped error");
    }
}
require('ts-node').register();
test();
