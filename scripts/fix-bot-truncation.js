const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'apex-bot-n8n-workflow.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const aiNode = data.nodes.find(n => n.name === 'Gemini AI');
let code = aiNode.parameters.jsCode;

// Replace the REGLAS IMPORTANTES section with a more concise one that emphasizes completing sentences
// We'll find the section between "REGLAS IMPORTANTES:" and "El usuario se llama:"
const reglaStart = code.indexOf('REGLAS IMPORTANTES:');
const reglaEnd = code.indexOf('El usuario se llama:');

if (reglaStart !== -1 && reglaEnd !== -1) {
    const before = code.substring(0, reglaStart);
    const after = code.substring(reglaEnd);

    const newReglas = `REGLAS CRITICAS:\\n- Responde SIEMPRE en español\\n- Maximo 2-3 oraciones cortas (es un chat, no un ensayo)\\n- SIEMPRE termina tus oraciones completas, NUNCA cortes a mitad de frase\\n- NO uses formato HTML ni markdown, solo texto plano con emojis\\n- Varia tu forma de responder\\n- Se CONCISO pero COMPLETO: mejor una respuesta corta y terminada que una larga cortada\\n\\n`;

    code = before + newReglas + after;
    console.log('Prompt rules replaced ✅');
} else {
    console.log('Could not find REGLAS section, start:', reglaStart, 'end:', reglaEnd);
}

// Also update the final instruction
code = code.replace(
    'Responde al \\u00faltimo mensaje del usuario de forma natural y fluida:',
    'Responde al ultimo mensaje de forma natural, concisa y COMPLETA:'
);

// Try alternative encoding
code = code.replace(
    'Responde al último mensaje del usuario de forma natural y fluida:',
    'Responde al ultimo mensaje de forma natural, concisa y COMPLETA:'
);

aiNode.parameters.jsCode = code;
fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');

// Verify
const verifyCode = JSON.parse(fs.readFileSync(filePath, 'utf8')).nodes.find(n => n.name === 'Gemini AI').parameters.jsCode;
console.log('Has REGLAS CRITICAS:', verifyCode.includes('REGLAS CRITICAS'));
console.log('Has COMPLETA:', verifyCode.includes('COMPLETA'));
console.log('Has SIEMPRE termina:', verifyCode.includes('SIEMPRE termina'));
console.log('Has maxOutputTokens 4096:', verifyCode.includes('maxOutputTokens: 4096'));
console.log('Has timeout 60000:', verifyCode.includes('timeout: 60000'));
console.log('\nAll done!');
