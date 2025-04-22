import webpush from 'web-push';

// Gerar as chaves VAPID
const vapidKeys = webpush.generateVAPIDKeys();

console.log('============ NOVAS CHAVES VAPID ============');
console.log(`Chave Pública:\n${vapidKeys.publicKey}`);
console.log(`Chave Privada:\n${vapidKeys.privateKey}`);
console.log('=============================================');