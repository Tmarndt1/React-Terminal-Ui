import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, "styles.css");
const destination = resolve(root, "dist", "styles.css");

if (!existsSync(source)) {
  throw new Error(`Missing stylesheet at ${source}`);
}

mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
