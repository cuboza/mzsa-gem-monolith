const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'db.json');

try {
    const rawData = fs.readFileSync(dbPath, 'utf8');
    const db = JSON.parse(rawData);
    const accessories = db.accessories || [];

    console.log(`Всего аксессуаров: ${accessories.length}`);

    const keywords = ['универсальн', 'для всех', 'любой'];

    const universal = accessories.filter(acc => {
        const text = ((acc.name || '') + ' ' + (acc.description || '')).toLowerCase();
        return keywords.some(kw => text.includes(kw));
    });

    console.log(`Найдено потенциально универсальных: ${universal.length}`);
    
    if (universal.length > 0) {
        console.log('\nСписок:');
        universal.forEach(acc => {
            // Extract SKU from ID if possible (acc-SKU)
            const sku = acc.id.replace('acc-', '');
            console.log(`- [${sku}] ${acc.name} (${acc.price} ₽)`);
        });
    }

} catch (error) {
    console.error('Ошибка:', error.message);
}
