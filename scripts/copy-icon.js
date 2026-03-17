const fs = require("fs");
const path = require("path");

const base64Png =
  "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAxElEQVR4Ae3WQQ6DMAwF0Nz/0qnQipJgJrped1IovnHgwlHGawEq+yLkOlLXg4ci9yi5xRngkQCIECBAgAABAgQIECBA4H8GKCdrIW6DCe4k74vNysGEKMluSleqrsAsjwELyhl725LLJoCq114F8CbnMD4HzyBbs596k8ZZrVSu2Ce279b9Ec/WWEDuJeayQMZT6X0hgqPES9vywgyehZ9erjRzCQXDpUe1koRaSPo6e7iLF730cdpShUMpOWcZH/AsLiCFYI8aAizI0s5momkGLwZ5qKY6Ch12yvDqOiiMHDL/95B2S/bOBhCV2wAPOQgQIECBAgAABAgQIECBA4A98A2h0/pk3jfbQAAAAAElFTkSuQmCC";

const assetDir = path.resolve(__dirname, "..", "assets");
const iconPath = path.join(assetDir, "icon.png");

fs.mkdirSync(assetDir, { recursive: true });
fs.writeFileSync(iconPath, Buffer.from(base64Png, "base64"));
