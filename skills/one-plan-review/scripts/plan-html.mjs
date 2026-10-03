#!/usr/bin/env node
import { readFileSync, writeFileSync, watch, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { resolve, dirname, basename, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = name => args.includes(name);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i !== -1 && args[i + 1] ? args[i + 1] : def;
};

// The project root is where you run the command (override with --root); the script
// itself can live anywhere, in any agent's skills folder or a global one.
const root = resolve(opt("--root", process.cwd()));

const input = resolve(root, opt("--in", "PLAN.md"));
const output = resolve(root, opt("--out", "PLAN.html"));
const templatePath = resolve(here, "../assets/plan-html.template.html");
const port = Number(opt("--port", 4173));

const hash = s => createHash("sha1").update(s).digest("hex").slice(0, 10);
const clean = s => s.replace(/\s+/g, " ").trim();

function parseBlocks(rawLines) {
  const blocks = [];
  let paragraph = [];
  const flushParagraph = () => {
    if (paragraph.length) {
      const text = clean(paragraph.join(" "));
      if (text) blocks.push({ type: "p", text });
      paragraph = [];
    }
  };
  let i = 0;
  while (i < rawLines.length) {
    const line = rawLines[i];
    const fence = line.match(/^```\s*(\S*)\s*$/);
    if (fence) {
      flushParagraph();
      const lang = fence[1] || "";
      const code = [];
      i++;
      while (i < rawLines.length && !/^```\s*$/.test(rawLines[i])) {
        code.push(rawLines[i]);
        i++;
      }
      i++;
      blocks.push({ type: "code", lang, code: code.join("\n") });
      continue;
    }
    if (!line.trim()) { flushParagraph(); i++; continue; }
    paragraph.push(line.trim());
    i++;
  }
  flushParagraph();
  return blocks;
}

const MAX_FILES = 10;
const STATUS_RE = "(NEW|MODIFIED|DELETED)";
const statusOf = s => s.toLowerCase();

// Parses the "**Files affected:**" section. One entry per file:
//   `path/to/file.go` — 🟢 NEW         (status word NEW | MODIFIED | DELETED, optional emoji before it)
//   ```go ... ```                      (the fenced code or diff; omitted for DELETED)
function parseFiles(lines) {
  const files = [];
  const entryRe = new RegExp(`^\`([^\`]+)\`\\s*[—–-]+\\s*(?:[^\\sA-Za-z]+\\s+)?${STATUS_RE}\\b`, "i");
  let i = 0;
  while (i < lines.length) {
    const entry = lines[i].trim().match(entryRe);
    i++;
    if (!entry) continue;
    const file = { path: entry[1].trim(), status: statusOf(entry[2]), lang: "", code: "" };
    let j = i;
    while (j < lines.length && !lines[j].trim()) j++;
    const fence = j < lines.length ? lines[j].match(/^\s*```\s*(\S*)\s*$/) : null;
    if (fence) {
      file.lang = fence[1] || "";
      const code = [];
      j++;
      while (j < lines.length && !/^\s*```\s*$/.test(lines[j])) { code.push(lines[j]); j++; }
      file.code = code.join("\n");
      i = j + 1;
    }
    files.push(file);
  }
  return files;
}

function parse(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const titleLine = lines.find(l => /^# /.test(l)) ?? "# Untitled plan";
  const title = titleLine.replace(/^#\s*/, "").replace(/^(TODO|PLAN):\s*/i, "").trim();
  const shortTitle = title.replace(/\s*\([^)]*\)\s*$/, "").trim();

  const sectionOf = name => {
    const start = lines.findIndex(l => new RegExp(`^##\\s+${name}\\b`, "i").test(l));
    if (start === -1) return [];
    const end = lines.findIndex((l, i) => i > start && /^## /.test(l));
    return lines.slice(start + 1, end === -1 ? undefined : end);
  };

  const introStart = lines.indexOf(titleLine) + 1;
  const introEnd = lines.findIndex((l, i) => i >= introStart && /^##? /.test(l));
  const intro = clean(lines.slice(introStart, introEnd === -1 ? undefined : introEnd).join(" "));

  const tableStatus = new Map();
  for (const l of sectionOf("Progress Tracker")) {
    const m = l.match(/^\|\s*(T-\d+)\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|/);
    if (m) tableStatus.set(m[1], /✅|done/i.test(m[3]));
  }

  const tickets = [];
  const taskLines = sectionOf("Tasks");
  let cur = null;
  let mode = null;
  const flush = () => {
    if (!cur) return;
    cur.description = parseBlocks(cur.descriptionLines);
    cur.files = parseFiles(cur.fileLines);
    if (cur.sawFiles && !cur.files.length) log(`warning: ${cur.id} has a "Files affected" section but no file entries were recognised (expected \`path\` — 🟢 NEW | 🟡 MODIFIED | 🔴 DELETED)`);
    delete cur.sawFiles;
    delete cur.descriptionLines;
    delete cur.fileLines;
    const allChecked = cur.criteria.length > 0 && cur.criteria.every(c => c.done);
    cur.done = tableStatus.has(cur.id) ? tableStatus.get(cur.id) : allChecked;
    cur.hash = hash([cur.title, JSON.stringify(cur.description), JSON.stringify(cur.files), ...cur.criteria.map(c => c.text)].join("\n"));
    tickets.push(cur);
    cur = null;
  };
  let inFence = false;
  const tasksStart = lines.findIndex(l => /^##\s+Tasks\b/i.test(l)) + 1;
  for (const [n, raw] of taskLines.entries()) {
    const l = raw.trimEnd();
    const isFence = /^\s*```/.test(l);
    if (isFence) inFence = !inFence;
    if (!isFence && !inFence) {
      const head = l.match(/^#{3,5}\s+(T-\d+)\s*:\s*(.+)$/);
      if (head) {
        flush();
        cur = { id: head[1], title: head[2].trim(), line: tasksStart + n + 1, descriptionLines: [], fileLines: [], criteria: [] };
        mode = null;
        continue;
      }
      if (!cur) continue;
      if (/^\*\*Description:?\*\*/i.test(l)) { mode = "desc"; const rest = l.replace(/^\*\*Description:?\*\*\s*/i, ""); if (rest) cur.descriptionLines.push(rest); continue; }
      if (/^\*\*Acceptance Criteria:?\*\*/i.test(l)) { mode = "ac"; continue; }
      if (/^\*\*Files affected:?\*\*/i.test(l)) { mode = "files"; cur.sawFiles = true; continue; }
      if (/^---+$/.test(l)) { mode = null; continue; }
      const ac = l.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.+)$/);
      if (mode === "ac" && ac) { cur.criteria.push({ text: ac[2].trim(), done: ac[1].toLowerCase() === "x" }); continue; }
    }
    if (!cur) continue;
    if (mode === "desc") cur.descriptionLines.push(l);
    if (mode === "files") cur.fileLines.push(l);
  }
  flush();

  const notes = sectionOf("Notes")
    .map(l => l.match(/^\s*[-*]\s+(.+)$/))
    .filter(Boolean)
    .map(m => m[1].trim());

  return {
    title,
    shortTitle,
    intro,
    eyebrow: `Plan · ${basename(input)} · ${tickets.length} tasks`,
    storageKey: `plan-feedback:${basename(input)}`,
    maxFiles: MAX_FILES,
    source: basename(input),
    rendered: basename(output),
    tickets,
    notes
  };
}

function build() {
  const started = performance.now();
  const md = readFileSync(input, "utf8");
  const plan = parse(md);
  if (plan.tickets.length === 0) throw new Error("no T-<n> tasks found under ## Tasks");
  for (const t of plan.tickets) {
    if (t.files.length > plan.maxFiles) log(`warning: ${t.id} lists ${t.files.length} files (max ${plan.maxFiles}) — consider splitting the task`);
  }
  const template = readFileSync(templatePath, "utf8");
  const json = JSON.stringify(plan).replace(/</g, "\\u003c");
  const html = template
    .replace("__PLAN__", json)
    .replace("__TITLE__", plan.shortTitle.replace(/[<>&"]/g, ""))
    .replace("__BUILD__", hash(json));
  writeFileSync(output, html);
  const ms = (performance.now() - started).toFixed(1);
  const done = plan.tickets.filter(t => t.done).length;
  log(`built ${relative(root, output)} · ${done}/${plan.tickets.length} done · ${ms}ms`);
}

function safeBuild() {
  try { build(); } catch (err) { log(`skipped: ${err.message}`); }
}

function log(msg) {
  const t = new Date().toLocaleTimeString("en-GB");
  console.log(`\x1b[2m${t}\x1b[0m ${msg}`);
}

function startWatch() {
  let timer;
  let lastMtime = statSync(input).mtimeMs;
  const trigger = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!existsSync(input)) return;
      const m = statSync(input).mtimeMs;
      if (m === lastMtime) return;
      lastMtime = m;
      safeBuild();
    }, 120);
  };
  watch(dirname(input), (_, file) => { if (file === basename(input)) trigger(); });
  watch(dirname(templatePath), (_, file) => { if (file === basename(templatePath)) { lastMtime = 0; trigger(); } });
  log(`watching ${relative(root, input)} (and the template)`);
}

const types = { ".html": "text/html; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

function startServe() {
  const server = createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    const path = url.pathname === "/" ? output : resolve(root, "." + decodeURIComponent(url.pathname));
    const allowed = path === output || path.startsWith(root + "/");
    if (!allowed || !existsSync(path) || statSync(path).isDirectory()) {
      res.writeHead(404); res.end("not found"); return;
    }
    res.writeHead(200, { "Content-Type": types[extname(path)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    res.end(readFileSync(path));
  });
  server.listen(port, "127.0.0.1", () => log(`serving http://localhost:${port}/ with live reload`));
}

if (flag("--help") || flag("-h")) {
  console.log(`usage: node <path-to-this-skill>/scripts/plan-html.mjs [--watch] [--serve] [--port 4173] [--root .] [--in PLAN.md] [--out PLAN.html]

  (no flags)   build PLAN.html once
  --watch      rebuild whenever PLAN.md or the template changes
  --serve      serve the project over http with live reload
  --port       port for --serve (default 4173)
  --root       project folder holding PLAN.md (default: current directory)`);
  process.exit(0);
}

if (!existsSync(input)) {
  console.error(`${input} not found — run this from the project root, or pass --root <dir> / --in <file>`);
  process.exit(1);
}

safeBuild();
if (flag("--watch") || flag("--serve")) startWatch();
if (flag("--serve")) startServe();
