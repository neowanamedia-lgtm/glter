$path = 'C:\Projects\seloa\src\hooks\usePassage.ts'
$lines = Get-Content $path
$new = New-Object System.Collections.Generic.List[string]
$added = $false
foreach ($line in $lines) {
  if ($line -match "import .*../data/passages/") {
    if (-not $added) {
      $new.Add("import easternLaoziKo from '../data/passages/eastern/ko/laozi.json';")
      $new.Add('')
      $added = $true
    }
    continue
  }
  $new.Add($line)
}
if (-not $added) {
  $new.Insert(0, "import easternLaoziKo from '../data/passages/eastern/ko/laozi.json';")
  $new.Insert(1, '')
}
Set-Content -Path $path -Value $new
