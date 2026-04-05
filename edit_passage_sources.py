from pathlib import Path
import re
path = Path(r"C:\Projects\seloa\src\hooks\usePassage.ts")
text = path.read_text()
replacement = "const PASSAGE_SOURCES: LibraryEntry[] = [\n  { loader: () => easternClassicsMixKo as PassageFile, category: 'eastern_philosophy', language: 'ko' },\n  { loader: () => easternConfuciusKo as PassageFile, category: 'eastern_philosophy', language: 'ko' },\n  { loader: () => easternLaoziKo as PassageFile, category: 'eastern_philosophy', language: 'ko' },\n  { loader: () => easternMenciusKo as PassageFile, category: 'eastern_philosophy', language: 'ko' },\n  { loader: () => easternZhuangziKo as PassageFile, category: 'eastern_philosophy', language: 'ko' },\n  { loader: () => westernEpictetusKo as PassageFile, category: 'western_philosophy', language: 'ko' },\n  { loader: () => westernMarcusAureliusKo as PassageFile, category: 'western_philosophy', language: 'ko' },\n  { loader: () => westernSartreFreudKo as PassageFile, category: 'western_philosophy', language: 'ko' },\n  { loader: () => westernSenecaKo as PassageFile, category: 'western_philosophy', language: 'ko' },\n  { loader: () => westernMisc01Ko as PassageFile, category: 'western_philosophy', language: 'ko' },\n];"
text_new = re.sub(r"const PASSAGE_SOURCES: LibraryEntry\[] = \[.*?\];", replacement, text, flags=re.S)
if text == text_new:
    raise SystemExit('PASSAGE_SOURCES not replaced')
path.write_text(text_new)
