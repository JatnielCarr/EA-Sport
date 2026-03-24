import { buildApp } from './src/app';

async function test() {
    try {
        const app = await buildApp();
        console.log("App built successfully");
    } catch (err: any) {
        const fs = require('fs');
        fs.writeFileSync('error_dump.txt', err.message);
        console.error("Dumped error");
    }
}
test();
