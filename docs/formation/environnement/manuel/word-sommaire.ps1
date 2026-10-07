# Ouvre le manuel dans Word, met à jour la table des matières et enregistre (sans export PDF, qui se bloque sur ce poste).
$ErrorActionPreference = 'Stop'
$dossier = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$docx = Join-Path $dossier 'Manuel-de-formation-INTEGRITE-plus.docx'
$journal = Join-Path $env:TEMP 'word-sommaire.log'
function Note($t) { "{0:HH:mm:ss} {1}" -f (Get-Date), $t | Add-Content $journal }
Remove-Item $journal -ErrorAction SilentlyContinue
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0; $w.ScreenUpdating = $false
try {
    $d = $w.Documents.Open($docx, $false, $false, $false)
    Note 'ouvert'
    if ($d.TablesOfContents.Count -gt 0) { $d.TablesOfContents.Item(1).Update(); Note 'sommaire mis à jour' }
    Note ('pages : ' + $d.ComputeStatistics(2))
    $d.Save()
    Note 'enregistré'
    $d.Close($false)
    Note 'FIN'
} catch { Note ('ERREUR : ' + $_.Exception.Message) } finally { $w.Quit() }
