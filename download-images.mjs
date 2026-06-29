import fs from 'fs';
import https from 'https';

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, function(response) {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', function() {
        file.close(resolve);
      });
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  try {
    await download('https://placehold.co/32x32/png?text=Icon', './public/favicon.ico');
    await download('https://placehold.co/192x192/png?text=Icon', './public/icon-192x192.png');
    await download('https://placehold.co/512x512/png?text=Icon', './public/icon-512x512.png');
    await download('https://placehold.co/1280x720/png?text=Desktop', './public/screenshot-desktop.png');
    await download('https://placehold.co/720x1280/png?text=Mobile', './public/screenshot-mobile.png');
    console.log('Images downloaded successfully');
  } catch(e) {
    console.error('Error downloading images:', e);
  }
}
main();
