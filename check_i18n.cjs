const fs = require("node:fs");
const path = require("node:path");

const enPath = path.join(process.cwd(), "src/messages/en.json");
const idPath = path.join(process.cwd(), "src/messages/id.json");

const en = JSON.parse(fs.readFileSync(enPath, "utf8"));
const id = JSON.parse(fs.readFileSync(idPath, "utf8"));

function getKeys(obj, prefix = "") {
  let keys = [];
  for (const k in obj) {
    if (typeof obj[k] === "object" && obj[k] !== null) {
      keys = keys.concat(getKeys(obj[k], `${prefix + k}.`));
    } else {
      keys.push(prefix + k);
    }
  }
  return keys;
}

const enKeys = getKeys(en);
const idKeys = getKeys(id);

const missingInId = enKeys.filter((k) => !idKeys.includes(k));
const missingInEn = idKeys.filter((k) => !enKeys.includes(k));

console.log("Missing in ID:", missingInId);
console.log("Missing in EN:", missingInEn);
