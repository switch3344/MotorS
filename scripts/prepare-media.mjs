import fs from "node:fs";
const sources = [
  { file: "hero.webm", type: "video/webm" },
  { file: "hero.mp4", type: "video/mp4" },
]
  .filter((s) => fs.existsSync("public/video/" + s.file))
  .filter((s) => {
    const bytes = fs.statSync("public/video/" + s.file).size;
    if (bytes > 8 * 1024 * 1024) {
      console.warn(s.file + ": skipped; exceeds 8 MB video budget");
      return false;
    }
    return true;
  })
  .map((s) => {
    return { src: "/video/" + s.file, type: s.type };
  });
const poster = fs.existsSync("public/video/hero.jpg") ? "/video/hero.jpg" : "";
fs.writeFileSync(
  "src/config/media.generated.json",
  JSON.stringify({ poster, sources }, null, 2) + "\n",
);
console.log(
  "Hero media: " +
    (sources.length
      ? sources.map((s) => s.src).join(", ")
      : "native GT-R preview and original video") +
    "; " +
    poster,
);
