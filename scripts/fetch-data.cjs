const fs = require('fs');
const path = require('path');
const https = require('https');

const isVercel = process.env.VERCEL === '1';
const allowFetch = process.env.ALLOW_DATA_FETCH === '1' || process.env.ALLOW_DATA_FETCH === 'true';

if (isVercel && !allowFetch) {
  console.log('Skipping dataset fetch on Vercel. Set ALLOW_DATA_FETCH=1 to enable.');
  process.exit(0);
}

const baseUrl =
  process.env.LONGMEMEVAL_DATA_BASE ||
  'https://huggingface.co/datasets/xiaowu0162/LongMemEval/resolve/main';

const targets = [
  { file: 'longmemeval_s_cleaned.json', url: `${baseUrl}/longmemeval_s_cleaned.json` },
  { file: 'longmemeval_m_cleaned.json', url: `${baseUrl}/longmemeval_m_cleaned.json` }
];

const outputDir = path.join(process.cwd(), 'data', 'raw');
fs.mkdirSync(outputDir, { recursive: true });

const download = (target) =>
  new Promise((resolve, reject) => {
    const filePath = path.join(outputDir, target.file);
    console.log(`Downloading ${target.url}`);
    const file = fs.createWriteStream(filePath);
    https
      .get(target.url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed with status ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', (err) => {
        fs.unlink(filePath, () => reject(err));
      });
  });

Promise.all(targets.map(download))
  .then(() => {
    console.log('Download complete.');
  })
  .catch((err) => {
    console.error('Dataset fetch failed:', err.message);
    process.exit(1);
  });
