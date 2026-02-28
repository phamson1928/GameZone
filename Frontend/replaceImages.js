const fs = require('fs');
const glob = require('glob');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(srcDir, function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Remove Image from react-native imports
        if (content.includes('react-native') && /\bImage\b/.test(content)) {
            content = content.replace(/(import\s*\{\s*[^}]*)(\bImage\b)\s*,?\s*([^}]*\s*\}\s*from\s*['"]react-native['"])/g, (match, p1, p2, p3) => {
                let cleaned = (p1 + p3).replace(/\{\s*,\s*|\s*,\s*\}/g, match => match.includes('{') ? '{' : '}').replace(/,\s*,/g, ',');
                return cleaned;
            });
            // Add expo-image import
            if (!content.includes('expo-image') && original.includes('Image')) {
                content = content.replace(/(import\s*\{.*\}\s*from\s*['"]react-native['"];)/, "$1\nimport { Image } from 'expo-image';");
                // if no "from 'react-native'" matched, just prepend it
                if (content === original) {
                    content = "import { Image } from 'expo-image';\n" + content;
                }
            }
        }

        // Change `<Image` props
        if (content !== original) {
            // Very basic approach: add contentFit, transition, and cachePolicy to any <Image tag if not present
            content = content.replace(/<Image([\s\S]*?)\/?>/g, (match, props) => {
                let newProps = props;
                if (!newProps.includes('contentFit')) {
                    newProps = newProps.replace(/resizeMode={?["']\w+["']}?/, ''); // remove resizeMode="cover"
                    newProps = newProps + ` contentFit="cover" transition={500} cachePolicy="disk"`;
                }
                return match.endsWith('/>') ? `<Image${newProps}/>` : `<Image${newProps}>`;
            });
            fs.writeFileSync(filePath, content, 'utf8');
            console.log('Updated', filePath);
        }
    }
});
