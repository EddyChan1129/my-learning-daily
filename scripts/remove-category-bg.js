const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const INPUT_DIR = path.join(process.cwd(), "public/images/category");
const OUTPUT_DIR = path.join(process.cwd(), "public/images/category_no_bg");

// 如果你個 folder 唔係 public/images/category
// 例如係 images/category，就改成：
// const INPUT_DIR = path.join(process.cwd(), "images/category");
// const OUTPUT_DIR = path.join(process.cwd(), "images/category_no_bg");

const BG_THRESHOLD = 220;

// 判斷係咪白 / 淺灰 checkerboard 背景
function isBackground(r, g, b, a) {
    if (a === 0) return true;

    const isLight = r > BG_THRESHOLD && g > BG_THRESHOLD && b > BG_THRESHOLD;
    const isGreyish =
        Math.abs(r - g) < 18 &&
        Math.abs(g - b) < 18 &&
        Math.abs(r - b) < 18;

    return isLight && isGreyish;
}

async function removeBackground(inputPath, outputPath) {
    const image = sharp(inputPath).ensureAlpha();

    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    const visited = new Uint8Array(width * height);
    const queue = [];

    function index(x, y) {
        return y * width + x;
    }

    function pixelOffset(x, y) {
        return (y * width + x) * channels;
    }

    function shouldRemove(x, y) {
        const offset = pixelOffset(x, y);
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const a = data[offset + 3];

        return isBackground(r, g, b, a);
    }

    function pushIfBg(x, y) {
        if (x < 0 || x >= width || y < 0 || y >= height) return;

        const i = index(x, y);
        if (visited[i]) return;

        if (shouldRemove(x, y)) {
            visited[i] = 1;
            queue.push([x, y]);
        }
    }

    // 只由圖片邊位開始 flood fill
    // 咁就唔會誤刪中間嘅白色文字
    for (let x = 0; x < width; x++) {
        pushIfBg(x, 0);
        pushIfBg(x, height - 1);
    }

    for (let y = 0; y < height; y++) {
        pushIfBg(0, y);
        pushIfBg(width - 1, y);
    }

    while (queue.length > 0) {
        const [x, y] = queue.shift();

        const offset = pixelOffset(x, y);
        data[offset + 3] = 0;

        pushIfBg(x + 1, y);
        pushIfBg(x - 1, y);
        pushIfBg(x, y + 1);
        pushIfBg(x, y - 1);
    }

    await sharp(data, {
        raw: {
            width,
            height,
            channels,
        },
    })
        .png()
        .toFile(outputPath);
}

async function main() {
    if (!fs.existsSync(INPUT_DIR)) {
        console.error("Input folder not found:", INPUT_DIR);
        process.exit(1);
    }

    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const files = fs
        .readdirSync(INPUT_DIR)
        .filter((file) => file.toLowerCase().endsWith(".png"));

    for (const file of files) {
        const inputPath = path.join(INPUT_DIR, file);
        const outputPath = path.join(OUTPUT_DIR, file);

        console.log(`Removing bg: ${file}`);
        await removeBackground(inputPath, outputPath);
    }

    console.log("Done. Output folder:", OUTPUT_DIR);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});