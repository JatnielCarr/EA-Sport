
import 'dotenv/config';
import { telegramService } from '../src/config/telegram';

async function main() {
    console.log('🗑️ Clearing Telegram Webhook...');
    try {
        const result = await telegramService.deleteWebhook();
        console.log('Result:', result);
        if (result.ok) {
            console.log('✅ Webhook cleared successfully. You can now use Polling mode.');
        } else {
            console.error('❌ Failed to clear webhook:', result.description);
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();
