const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, 'apps', 'web', 'src');

const getCookieTokenStr = "(document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1])";
const getCookieUserStr = "(decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('user='))?.split('=')[1] || '{}'))";

const setTokenCookieStr = "document.cookie = `access_token=${data.data.access_token}; path=/; max-age=86400`; document.cookie = `refresh_token=${data.data.refresh_token}; path=/; max-age=604800`;";
const setUserCookieStr = "document.cookie = `user=${encodeURIComponent(JSON.stringify(data.data.user))}; path=/; max-age=86400`;";

let changes = 0;

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(path.join(dir, f));
        }
    });
}

walkDir(SRC_DIR, (file) => {
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) return;
    
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // fix the old logic that might have document.cookie 'token=' from previous iterations manually typed
    content = content.replace(/document\.cookie\.split\('; '\)\.find\(row => row\.startsWith\('token='\)\)\?\.split\('='\)+\[1\]/g, getCookieTokenStr);
    
    // Getting token
    content = content.replace(/localStorage\.getItem\(['"]access_token['"]\)/g, getCookieTokenStr);
    content = content.replace(/localStorage\.getItem\(['"]token['"]\)/g, getCookieTokenStr);
    
    // Getting user
    content = content.replace(/localStorage\.getItem\(['"]user['"]\)/g, `(document.cookie.split('; ').find(row => row.startsWith('user=')) ? ${getCookieUserStr} : null)`);
    
    // Setting token
    content = content.replace(/localStorage\.setItem\(['"]access_token['"]\s*,\s*data\.data\.access_token\);?/g, setTokenCookieStr);
    content = content.replace(/localStorage\.setItem\(['"]refresh_token['"]\s*,\s*data\.data\.refresh_token\);?/g, ""); // removed
    content = content.replace(/localStorage\.setItem\(['"]user['"]\s*,\s*JSON\.stringify\(data\.data\.user\)\);?/g, setUserCookieStr);
    content = content.replace(/localStorage\.setItem\(['"]user['"]\s*,\s*JSON\.stringify\(storedUser\)\);?/g, "document.cookie = `user=${encodeURIComponent(JSON.stringify(storedUser))}; path=/; max-age=86400`;");

    // clear all / remove items
    content = content.replace(/localStorage\.removeItem\(['"]access_token['"]\);?/g, "document.cookie = 'access_token=; path=/; max-age=0';");
    content = content.replace(/localStorage\.removeItem\(['"]refresh_token['"]\);?/g, "document.cookie = 'refresh_token=; path=/; max-age=0';");
    content = content.replace(/localStorage\.removeItem\(['"]user['"]\);?/g, "document.cookie = 'user=; path=/; max-age=0';");
    content = content.replace(/localStorage\.removeItem\(['"]user_data['"]\);?/g, "");

    content = content.replace(/localStorage\.clear\(\);?/g, "document.cookie = 'access_token=; path=/; max-age=0'; document.cookie = 'user=; path=/; max-age=0';");

    if (content !== original) {
        fs.writeFileSync(file, content);
        console.log("Updated: " + file);
        changes++;
    }
});

console.log("Finished replacing. Total files updated:", changes);
