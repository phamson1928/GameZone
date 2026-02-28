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

        // Check if it has <Image and missing expo-image import
        if (content.includes('<Image') && !content.includes('expo-image')) {
            // Find the react-native import and add expo-image after it
            content = content.replace(/(import\s*\{[^}]*\}\s*from\s*['"]react-native['"];?)/g, "$1\nimport { Image } from 'expo-image';");
            // If it failed to replace (maybe no react-native import?), just put it at the top
            if (content === original) {
                content = "import { Image } from 'expo-image';\n" + content;
            }
        }

        // Replace Image tags
        if (content !== original || content.includes('<Image')) {
            content = content.replace(/<Image([\s\S]*?)\/?>/g, (match, props) => {
                let newProps = props;
                if (!newProps.includes('contentFit')) {
                    newProps = newProps.replace(/\n\s*resizeMode={?["']\w+["']}?|\s*resizeMode={?["']\w+["']}?/, '');

                    // Add expo props
                    let cleanProps = newProps.trimEnd();
                    if (!cleanProps.includes('contentFit')) cleanProps += ' contentFit="cover"';
                    if (!cleanProps.includes('transition')) cleanProps += ' transition={200}';
                    if (!cleanProps.includes('cachePolicy')) cleanProps += ' cachePolicy="disk"';

                    // Reconstruct match
                    return match.endsWith('/>') ? `<Image ${cleanProps} />` : `<Image ${cleanProps}>`;
                }
                return match;
            });

            if (content !== original) {
                fs.writeFileSync(filePath, content, 'utf8');
                console.log('Updated', filePath);
            }
        }
    }
});
