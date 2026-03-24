const http = require('http');
const fs = require('fs');
const path = require('path');

const N8N_URL = 'http://localhost:5678';

function httpRequest(method, urlPath, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5678,
            path: urlPath,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    try {
        // 1. List existing workflows
        console.log('📋 Listando workflows existentes...');
        const list = await httpRequest('GET', '/api/v1/workflows');

        if (list.status === 401 || (typeof list.data === 'string' && list.data.includes('Unauthorized'))) {
            console.log('⚠️  n8n requiere autenticación. Intentando sin auth header...');
        }

        console.log('Status:', list.status);

        let workflowId = null;

        if (list.data && list.data.data) {
            list.data.data.forEach(w => {
                console.log(`  - ID: ${w.id}, Name: ${w.name}, Active: ${w.active}`);
                if (w.name && w.name.includes('Apex') || w.name && w.name.includes('Telegram')) {
                    workflowId = w.id;
                }
            });
        } else {
            console.log('Response:', JSON.stringify(list.data).substring(0, 300));
        }

        // 2. Load updated workflow
        const workflowFile = path.join(__dirname, '..', 'apex-bot-n8n-workflow.json');
        const workflow = JSON.parse(fs.readFileSync(workflowFile, 'utf8'));

        if (workflowId) {
            // Update existing workflow
            console.log(`\n🔄 Actualizando workflow ${workflowId}...`);
            workflow.id = workflowId;
            const update = await httpRequest('PUT', `/api/v1/workflows/${workflowId}`, workflow);
            console.log('Update status:', update.status);
            if (update.status === 200) {
                console.log('✅ Workflow actualizado exitosamente!');

                // Activate it
                const activate = await httpRequest('POST', `/api/v1/workflows/${workflowId}/activate`);
                console.log('Activate status:', activate.status);
                if (activate.status === 200) {
                    console.log('✅ Workflow activado!');
                }
            } else {
                console.log('Response:', JSON.stringify(update.data).substring(0, 300));
            }
        } else {
            // Import as new workflow
            console.log('\n📥 Importando workflow como nuevo...');
            const create = await httpRequest('POST', '/api/v1/workflows', workflow);
            console.log('Create status:', create.status);
            if (create.status === 200 || create.status === 201) {
                console.log('✅ Workflow importado! ID:', create.data.id || create.data.data?.id);
            } else {
                console.log('Response:', JSON.stringify(create.data).substring(0, 300));
            }
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.log('n8n no está corriendo en localhost:5678');
        }
    }
}

main();
