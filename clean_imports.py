from pathlib import Path
path = Path(r"C:\Projects\seloa\src\hooks\usePassage.ts")
lines = path.read_text().splitlines()
new_lines = []
inserted = False
for line in lines:
    if "../data/passages/" in line:
        if not inserted:
            new_lines.append("import easternLaoziKo from '../data/passages/eastern/ko/laozi.json';")
            inserted = True
        continue
    new_lines.append(line)
if not inserted:
    new_lines.insert(0, "import easternLaoziKo from '../data/passages/eastern/ko/laozi.json';")
path.write_text("\n".join(new_lines) + "\n")
