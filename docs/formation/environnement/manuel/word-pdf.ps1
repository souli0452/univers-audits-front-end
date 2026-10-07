# Rend le manuel avec Microsoft Word : met à jour la table des matières, exporte un PDF et enregistre le .docx mis à jour.
# Usage (PowerShell) : .\word-pdf.ps1
$ErrorActionPreference = 'Stop'
$dossier = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$docx = Join-Path $dossier 'Manuel-de-formation-INTEGRITE-plus.docx'
$pdf  = Join-Path $dossier 'Manuel-de-formation-INTEGRITE-plus.pdf'
$journal = Join-Path $env:TEMP 'word-pdf.log'
function Note($t) { "{0:HH:mm:ss} {1}" -f (Get-Date), $t | Add-Content $journal; Write-Output $t }
Remove-Item $journal -ErrorAction SilentlyContinue

$w = New-Object -ComObject Word.Application
$w.Visible = $false
$w.DisplayAlerts = 0
$w.ScreenUpdating = $false
$w.Options.CheckSpellingAsYouType = $false
$w.Options.CheckGrammarAsYouType = $false
$w.Options.Pagination = $false
try {
    Note 'ouverture'
    $d = $w.Documents.Open($docx, $false, $false, $false)
    Note 'ouvert'
    $w.Options.Pagination = $true
    if ($d.TablesOfContents.Count -gt 0) { $d.TablesOfContents.Item(1).Update(); Note 'sommaire mis à jour' }
    Note ('pages : ' + $d.ComputeStatistics(2))
    $d.ExportAsFixedFormat($pdf, 17)
    Note 'pdf exporté'
    $d.Save()
    Note 'docx enregistré'
    $d.Close($false)
} catch { Note ('ERREUR : ' + $_.Exception.Message) } finally { $w.Quit() }
