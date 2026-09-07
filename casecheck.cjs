const { execSync } = require("child_process")
const path = require("path").posix
const fs = require("fs")

const tracked = new Set(
  execSync("git ls-files backend frontend", { encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean),
)

const lower = new Map()
for (const t of tracked) lower.set(t.toLowerCase(), t)

const sources = [...tracked].filter((f) => /\.(js|jsx|mjs)$/.test(f))
const problems = []

for (const f of sources) {
  const src = fs.readFileSync(f, "utf8")
  const re = /(?:from|import)\s*\(?\s*["'](\.[^"']+)["']/g
  let m
  while ((m = re.exec(src))) {
    const spec = m[1]
    const resolved = path.normalize(path.join(path.dirname(f), spec))
    if (tracked.has(resolved)) continue

    const line = src.slice(0, m.index).split("\n").length
    const hit = lower.get(resolved.toLowerCase())
    if (hit) {
      problems.push({ kind: "CASE", f, line, spec, actual: path.basename(hit) })
    } else {
      const alt = [resolved + ".js", resolved + ".jsx", resolved + "/index.js", resolved + "/index.jsx"]
      if (!alt.some((a) => tracked.has(a) || lower.has(a.toLowerCase()))) {
        problems.push({ kind: "MISSING", f, line, spec, actual: null })
      }
    }
  }
}

if (!problems.length) {
  console.log("No case mismatches or missing relative imports found.")
} else {
  for (const p of problems) {
    console.log(
      `${p.kind.padEnd(8)} ${p.f}:${p.line}\n         imports "${p.spec}"` +
        (p.actual ? `\n         actual file is "${p.actual}"` : ""),
    )
  }
  console.log(`\n${problems.length} problem(s)`)
}
