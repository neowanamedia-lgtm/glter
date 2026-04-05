$path = 'C:\Projects\seloa\src\hooks\usePassage.ts'
$text = Get-Content $path -Raw
$pattern = 'const PASSAGE_SOURCES: LibraryEntry\[] = \[.*?\];'
$replacement = "const PASSAGE_SOURCES: LibraryEntry[] = [`n  { loader: () => easternLaoziKo as PassageFile, category: 'eastern_philosophy', language: 'ko' },`n];"
$text = [regex]::Replace($text, $pattern, $replacement, 'Singleline')
Set-Content -Path $path -Value $text
