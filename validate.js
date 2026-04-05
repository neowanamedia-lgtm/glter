const path = require('path');
const fs = require('fs');
const files = [
  'src/data/passages/eastern/ko/classics_mix.json',
  'src/data/passages/eastern/ko/confucius.json',
  'src/data/passages/eastern/ko/laozi.json',
  'src/data/passages/eastern/ko/mencius.json',
  'src/data/passages/eastern/ko/zhuangzi.json',
  'src/data/passages/western/ko/epictetus.json',
  'src/data/passages/western/ko/marcus_aurelius.json',
  'src/data/passages/western/ko/nietzsche_01.json',
  'src/data/passages/western/ko/nietzsche_02.json',
  'src/data/passages/western/ko/nietzsche_03.json',
  'src/data/passages/western/ko/Plato.json',
  'src/data/passages/western/ko/sartre_freud.json',
  'src/data/passages/western/ko/seneca.json',
  'src/data/passages/western/ko/western_misc_01.json',
  'src/data/passages/religion/buddhism/ko/dhammapada.ko.json',
  'src/data/passages/religion/buddhism/ko/diamond_sutra.ko.json',
  'src/data/passages/religion/buddhism/ko/heart_sutra_ko.json',
  'src/data/passages/religion/buddhism/ko/mixed_sutras.ko.json',
  'src/data/passages/religion/christianity/ko/bible_nt_part1.json',
  'src/data/passages/religion/christianity/ko/bible_nt_part2.json',
  'src/data/passages/religion/christianity/ko/bible_ot_part1.json',
  'src/data/passages/religion/christianity/ko/bible_ot_part2.json',
  'src/data/passages/religion/islam/ko/quran_part1.json',
  'src/data/passages/religion/islam/ko/quran_part2.json',
  'src/data/passages/religion/islam/ko/quran_part3.json',
  'src/data/passages/religion/islam/ko/quran_part4.json',
];
const issues = [];
const encodingIssues = [];
const BAD = /\uFFFD|�/;

for (const file of files) {
  const full = path.join(process.cwd(), file);
  let raw;
  try {
    raw = fs.readFileSync(full, 'utf8');
  } catch (error) {
    issues.push({ file, problem: 'read failed', detail: error.message });
    continue;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    issues.push({ file, problem: 'json parse failed', detail: error.message });
    continue;
  }

  if (!data || !Array.isArray(data.passages)) {
    issues.push({ file, problem: 'passages missing' });
    continue;
  }

  data.passages.forEach((item, idx) => {
    const label = item && typeof item.id === 'string' ? item.id : `index_${idx}`;
    if (!item || typeof item.id !== 'string') {
      issues.push({ file, problem: `invalid id at ${idx}` });
    }
    if (!Array.isArray(item.lines)) {
      issues.push({ file, problem: `lines not array (${label})` });
      return;
    }
    item.lines.forEach((line, lineIdx) => {
      if (typeof line !== 'string' || !line.trim()) {
        issues.push({ file, problem: `invalid line ${lineIdx} (${label})` });
      }
      if (typeof line === 'string' && BAD.test(line)) {
        encodingIssues.push({ file, problem: `line ${lineIdx} has replacement char (${label})` });
      }
    });

    const meta = item.meta;
    if (meta === undefined || meta === null) {
      return;
    }
    if (typeof meta !== 'object') {
      issues.push({ file, problem: `meta not object (${label})` });
      return;
    }
    Object.entries(meta).forEach(([key, value]) => {
      if (typeof value === 'string' && BAD.test(value)) {
        encodingIssues.push({ file, problem: `meta ${key} has replacement char (${label})` });
      }
    });
  });
}

console.log('STRUCTURE', issues.length, issues.slice(0, 10));
console.log('ENCODING', encodingIssues.length, encodingIssues.slice(0, 10));
