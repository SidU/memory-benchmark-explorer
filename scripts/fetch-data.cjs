const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const isVercel = process.env.VERCEL === '1';
const allowFetch = process.env.ALLOW_DATA_FETCH === '1' || process.env.ALLOW_DATA_FETCH === 'true';
const forceFetch = process.env.FORCE_DATA_FETCH === '1' || process.env.FORCE_DATA_FETCH === 'true';

if (isVercel && !allowFetch) {
  console.log('Skipping dataset fetch on Vercel. Set ALLOW_DATA_FETCH=1 to enable.');
  process.exit(0);
}

const baseUrl =
  process.env.LONGMEMEVAL_DATA_BASE ||
  'https://huggingface.co/datasets/xiaowu0162/LongMemEval/resolve/main';
const apiUrl =
  process.env.LONGMEMEVAL_DATA_API ||
  'https://huggingface.co/api/datasets/xiaowu0162/LongMemEval';

const targetFiles = ['longmemeval_s_cleaned.json', 'longmemeval_m_cleaned.json'];
const candidateSubdirs = ['', 'data', 'raw', 'cleaned'];
const targets = targetFiles.map((file) => {
  const fallbackFile = file.replace(/_cleaned/i, '');
  const baseName = fallbackFile.replace(/\.json$/i, '');
  const fileCandidates = [file];
  if (fallbackFile !== file) {
    fileCandidates.push(fallbackFile);
  }
  if (!fileCandidates.includes(`${baseName}.json`)) {
    fileCandidates.push(`${baseName}.json`);
  }
  if (!fileCandidates.includes(baseName)) {
    fileCandidates.push(baseName);
  }
  const urls = [];
  candidateSubdirs.forEach((dir) => {
    fileCandidates.forEach((candidate) => {
      urls.push(dir ? `${baseUrl}/${dir}/${candidate}` : `${baseUrl}/${candidate}`);
    });
  });
  return { file, urls };
});

const outputDir = path.join(process.cwd(), 'data', 'raw');
fs.mkdirSync(outputDir, { recursive: true });
const targetsToDownload = forceFetch
  ? targets
  : targets.filter(({ file }) => {
      const exists = fs.existsSync(path.join(outputDir, file));
      if (exists) {
        console.log(`Found existing dataset file, skipping download: ${file}`);
      }
      return !exists;
    });

if (targetsToDownload.length === 0) {
  console.log('All dataset files already present. Set FORCE_DATA_FETCH=1 to re-download.');
  process.exit(0);
}

let cachedFileList = null;
let cachedReadmePaths = null;
const fetchJson = (url, redirectsLeft = 5) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const status = response.statusCode || 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          if (redirectsLeft <= 0) {
            reject(new Error('Too many redirects'));
            return;
          }
          const nextUrl = new URL(response.headers.location, url).toString();
          response.resume();
          fetchJson(nextUrl, redirectsLeft - 1).then(resolve).catch(reject);
          return;
        }
        if (status !== 200) {
          response.resume();
          reject(new Error(`Failed with status ${status}`));
          return;
        }
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (err) {
            reject(err);
          }
        });
      })
      .on('error', (err) => reject(err));
  });

const fetchText = (url, redirectsLeft = 5) =>
  new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        const status = response.statusCode || 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          if (redirectsLeft <= 0) {
            reject(new Error('Too many redirects'));
            return;
          }
          const nextUrl = new URL(response.headers.location, url).toString();
          response.resume();
          fetchText(nextUrl, redirectsLeft - 1).then(resolve).catch(reject);
          return;
        }
        if (status !== 200) {
          response.resume();
          reject(new Error(`Failed with status ${status}`));
          return;
        }
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => resolve(body));
      })
      .on('error', (err) => reject(err));
  });

const getFileList = async () => {
  if (!cachedFileList) {
    cachedFileList = fetchJson(apiUrl).then((data) =>
      Array.isArray(data?.siblings)
        ? data.siblings.map((item) => item?.rfilename).filter(Boolean)
        : []
    );
  }
  return cachedFileList;
};

const getReadmePaths = async () => {
  if (!cachedReadmePaths) {
    cachedReadmePaths = fetchText(`${baseUrl}/README.md`)
      .then((text) => {
        const paths = [];
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const match = line.match(/^\s*path:\s*(.+)\s*$/);
          if (match) {
            paths.push(match[1].trim());
          }
        }
        return paths;
      })
      .catch(() => []);
  }
  return cachedReadmePaths;
};

const buildDynamicUrls = async (targetFile) => {
  const files = await getFileList();
  const baseName = targetFile.replace(/\.json$/i, '');
  const fallbackBase = baseName.replace(/_cleaned$/i, '');
  const readmePaths = await getReadmePaths();
  const matches = files.filter((name) => {
    return (
      name.endsWith(targetFile) ||
      name.includes(baseName) ||
      (fallbackBase !== baseName && name.includes(fallbackBase))
    );
  });
  const readmeMatches = readmePaths.filter((name) => {
    const normalized = name.replace(/^\.\//, '');
    return (
      normalized.endsWith(targetFile) ||
      normalized.includes(baseName) ||
      (fallbackBase !== baseName && normalized.includes(fallbackBase))
    );
  });
  const combined = [...matches, ...readmeMatches];
  return combined.map((name) => `${baseUrl}/${name}`);
};

const download = (target) =>
  new Promise((resolve, reject) => {
    const filePath = path.join(outputDir, target.file);
    const tempPath = `${filePath}.partial`;
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    const fetchWithRedirects = (url, redirectsLeft = 5) =>
      new Promise((resolveFetch, rejectFetch) => {
        https
          .get(url, (response) => {
            const status = response.statusCode || 0;
            if (status >= 300 && status < 400 && response.headers.location) {
              if (redirectsLeft <= 0) {
                rejectFetch(new Error('Too many redirects'));
                return;
              }
              const nextUrl = new URL(response.headers.location, url).toString();
              response.resume();
              fetchWithRedirects(nextUrl, redirectsLeft - 1)
                .then(resolveFetch)
                .catch(rejectFetch);
              return;
            }
            if (status !== 200) {
              response.resume();
              rejectFetch(new Error(`Failed with status ${status}`));
              return;
            }
            const file = fs.createWriteStream(tempPath);
            response.pipe(file);
            file.on('finish', () =>
              file.close((err) => {
                if (err) {
                  rejectFetch(err);
                  return;
                }
                fs.rename(tempPath, filePath, (renameErr) => {
                  if (renameErr) {
                    rejectFetch(renameErr);
                    return;
                  }
                  resolveFetch();
                });
              })
            );
            file.on('error', (err) => {
              fs.unlink(tempPath, () => rejectFetch(err));
            });
          })
          .on('error', (err) => rejectFetch(err));
      });
    let triedDynamic = false;
    const tryNext = (index) => {
      if (index >= target.urls.length) {
        if (triedDynamic) {
          reject(new Error(`Failed to find ${target.file} at any known path`));
          return;
        }
        triedDynamic = true;
        buildDynamicUrls(target.file)
          .then((urls) => {
            if (urls.length === 0) {
              reject(new Error(`No candidate files found for ${target.file}`));
              return;
            }
            target.urls.push(...urls);
            tryNext(index);
          })
          .catch(reject);
        return;
      }
      const url = target.urls[index];
      console.log(`Downloading ${url}`);
      fetchWithRedirects(url).catch((err) => {
        if (String(err.message).includes('status 404')) {
          tryNext(index + 1);
          return;
        }
        fs.unlink(tempPath, () => {
          reject(err);
        });
      });
    };
    tryNext(0);
  });

Promise.all(targetsToDownload.map(download))
  .then(() => {
    console.log('Download complete.');
  })
  .catch((err) => {
    console.error('Dataset fetch failed:', err.message);
    process.exit(1);
  });
