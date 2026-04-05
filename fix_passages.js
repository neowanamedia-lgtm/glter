const fs = require('fs');
const path = require('path');
const files = [
  'src/data/passages/western/ko/epictetus.json',
  'src/data/passages/western/ko/nietzsche_01.json',
  'src/data/passages/western/ko/nietzsche_02.json',
  'src/data/passages/western/ko/nietzsche_03.json',
  'src/data/passages/western/ko/Plato.json',
  'src/data/passages/religion/christianity/ko/bible_nt_part1.json',
  'src/data/passages/religion/christianity/ko/bible_nt_part2.json',
  'src/data/passages/religion/christianity/ko/bible_ot_part1.json',
  'src/data/passages/religion/christianity/ko/bible_ot_part2.json',
  'src/data/passages/religion/islam/ko/quran_part1.json',
  'src/data/passages/religion/islam/ko/quran_part2.json',
  'src/data/passages/religion/islam/ko/quran_part3.json',
  'src/data/passages/religion/islam/ko/quran_part4.json',
  'src/data/passages/religion/buddhism/ko/dhammapada.ko.json',
  'src/data/passages/religion/buddhism/ko/heart_sutra_ko.json',
  'src/data/passages/religion/buddhism/ko/mixed_sutras.ko.json',
];

function sanitize(text) {
  let prev;
  let next = text;
  let attempts = 0;
  do {
    prev = next;
    next = prev.replace(/,\s*(?=[}\]])/g, '');
    attempts++;
  } while (next !== prev && attempts < 10);
  return next;
}

function ensurePassagesStructure(data) {
  if (Array.isArray(data)) {
    return { passages: data };
  }
  if (data && Array.isArray(data.passages)) {
    return data;
  }
  return { passages: [] };
}

files.forEach((file) => {
  const full = path.join(process.cwd(), file);
  let text = fs.readFileSync(full, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    try {
      const cleaned = sanitize(text);
      parsed = JSON.parse(cleaned);
      text = cleaned;
    } catch (inner) {
      console.error('Failed to parse', file, inner.message);
      throw inner;
    }
  }
  const structured = ensurePassagesStructure(parsed);
  fs.writeFileSync(full, JSON.stringify(structured, null, 2) + '\n');
});
