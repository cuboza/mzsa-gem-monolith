#!/usr/bin/env ts-node
/*
 * Заглушка для импорта данных из 1С (CSV -> нормализованный JSON).
 * TODO: заменить на реальную реализацию, когда будет утвержден формат выгрузки из 1С.
 */

import fs from 'node:fs';
import path from 'node:path';

interface ImportOptions {
  file: string;
  output?: string;
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2);
  const options: ImportOptions = { file: '' };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--file' && args[i + 1]) {
      options.file = args[++i];
    } else if (arg === '--output' && args[i + 1]) {
      options.output = args[++i];
    }
  }

  if (!options.file) {
    console.error('⚠️  Укажите CSV-файл: npm run import:1c -- --file=path/to/export.csv');
    process.exit(1);
  }

  return options;
}

function main() {
  const { file, output = 'dist/imported-from-1c.json' } = parseArgs();

  if (!fs.existsSync(file)) {
    console.error(`❌ CSV-файл не найден: ${file}`);
    process.exit(1);
  }

  console.log('ℹ️  Импорт из 1С пока не реализован.');
  console.log('    Полученный CSV можно сохранить, чтобы протестировать конвертер позже.');

  const stubPayload = {
    source: path.resolve(file),
    status: 'not-implemented',
    warehouses: ['SG-1', 'SG-vitrina', 'Service', 'SG-3', 'NB', 'NV', 'NU'],
    trailers: [],
    accessories: [],
  };

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(stubPayload, null, 2), 'utf8');

  console.log(`📝 Заглушка записана в ${output}`);
}

main();
