const fs = require('fs');
const path = require('path');
const https = require('https');

const effectsFile = path.join(__dirname, 'src', 'data', 'effects.json');
const effectsData = JSON.parse(fs.readFileSync(effectsFile, 'utf8'));

const outDir = path.join(__dirname, 'public', 'name-effects');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Referer': 'https://ragnarscans.com/effect/',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
            }
        }, function(response) {
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

async function run() {
    let changed = false;
    for (let i = 0; i < effectsData.length; i++) {
        let effect = effectsData[i];
        if (effect.category === 'name_effects' && effect.url.includes('ragnarscans.com/wp-content/uploads/')) {
            const parts = effect.url.split('/');
            const filename = parts[parts.length - 1];
            const destPath = path.join(outDir, filename);
            console.log('Downloading', effect.url, 'to', destPath);
            try {
                await download(effect.url, destPath);
                effect.url = `/name-effects/${filename}`;
                changed = true;
            } catch (err) {
                console.error('Error downloading', effect.url, err);
            }
        }
    }

    if (changed) {
        fs.writeFileSync(effectsFile, JSON.stringify(effectsData, null, 2), 'utf8');
        console.log('Done downloading and updating effects.json');
    } else {
        console.log('No matching effects found or no changes made.');
    }
}

run();
