import sharp from "sharp";
import fs from "fs";

const src = "assets/mindra.png"; // положи исходник сюда (или поменяй путь)
fs.mkdirSync("public/icons", { recursive: true });

await sharp(src).resize(192, 192).png().toFile("public/icons/icon-192.png");
await sharp(src).resize(512, 512).png().toFile("public/icons/icon-512.png");

// badge обычно маленький простой, но пусть будет 72x72
await sharp(src).resize(72, 72).png().toFile("public/icons/badge-72.png");

console.log("✅ icons generated in public/icons");
