// Hook PostToolUse (Edit|Write) : quand README.md (racine du projet) est modifié,
// crée documentation-dev/YYYY-MM-DD-HH-II-SS-Update-README.md avec le diff.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

let input = "";
process.stdin.on("data", (c) => (input += c));
process.stdin.on("end", () => {
  let data;
  try { data = JSON.parse(input); } catch { return; }
  const file = (data.tool_input && data.tool_input.file_path) || "";
  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const readme = path.join(root, "README.md");
  if (path.resolve(file).toLowerCase() !== path.resolve(readme).toLowerCase()) return;

  const snapshot = path.join(root, ".claude", "hooks", ".readme-last.md");
  if (!fs.existsSync(snapshot)) fs.writeFileSync(snapshot, "");

  let diff = "";
  try {
    execFileSync("git", ["diff", "--no-index", "--no-color", "--", snapshot, readme], { cwd: root, encoding: "utf8" });
  } catch (e) {
    diff = e.stdout || ""; // git diff --no-index renvoie le code 1 quand il y a des différences
  }
  if (!diff.trim()) return;
  diff = diff.split("\n").filter((l) => !/^(diff --git|index |--- |\+\+\+ )/.test(l)).join("\n");

  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  const outDir = path.join(root, "documentation-dev");
  fs.mkdirSync(outDir, { recursive: true });

  const block = ["```diff", diff.trim(), "```", ""].join("\n");
  const outFile = path.join(outDir, `${stamp}-Update-README.md`);
  if (fs.existsSync(outFile)) {
    // Plusieurs modifications dans la même seconde : on complète la fiche au lieu de l'écraser.
    fs.appendFileSync(outFile, "\n" + block);
  } else {
    const header = [
      `# Mise à jour du README.md — ${stamp}`,
      "",
      `- **Date** : ${d.toLocaleString("fr-BE")}`,
      `- **Outil** : ${data.tool_name}`,
      "",
      "## Modifications",
      "",
      "",
    ].join("\n");
    fs.writeFileSync(outFile, header + block);
  }
  fs.copyFileSync(readme, snapshot);
});
