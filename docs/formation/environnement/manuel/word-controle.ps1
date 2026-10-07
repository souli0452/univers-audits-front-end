# Contrôle de mise en page du manuel avec Word (sans export PDF) : images, titres par page, pages presque vides.
$ErrorActionPreference = 'Stop'
$dossier = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$docx = Join-Path $dossier 'Manuel-de-formation-INTEGRITE-plus.docx'
$sortie = Join-Path $env:TEMP 'word-controle.txt'
Remove-Item $sortie -ErrorAction SilentlyContinue
function Ecrire($t) { $t | Add-Content -Encoding UTF8 $sortie }
$w = New-Object -ComObject Word.Application
$w.Visible = $false; $w.DisplayAlerts = 0; $w.ScreenUpdating = $false
try {
    $d = $w.Documents.Open($docx, $false, $true, $false)
    $pages = $d.ComputeStatistics(2)
    Ecrire "PAGES=$pages"
    $largeurTexte = $d.PageSetup.PageWidth - $d.PageSetup.LeftMargin - $d.PageSetup.RightMargin
    Ecrire ("LARGEUR_TEXTE_PT={0:N1}" -f $largeurTexte)
    $max = 0; $trop = 0
    foreach ($s in $d.InlineShapes) { if ($s.Width -gt $max) { $max = $s.Width }; if ($s.Width -gt $largeurTexte + 1) { $trop++ } }
    Ecrire ("IMAGES={0} LARGEUR_MAX_PT={1:N1} DEPASSENT={2}" -f $d.InlineShapes.Count, $max, $trop)
    Ecrire "--- TITRES (niveau, page, texte)"
    foreach ($par in $d.Paragraphs) {
        $niv = $par.OutlineLevel
        if ($niv -le 2) { Ecrire ("{0}|{1}|{2}" -f $niv, $par.Range.Information(3), ($par.Range.Text.Trim())) }
    }
    Ecrire "--- CARACTERES PAR PAGE"
    for ($i = 1; $i -le $pages; $i++) {
        $debut = $d.GoTo(1, 1, $i).Start
        $fin = if ($i -lt $pages) { $d.GoTo(1, 1, $i + 1).Start } else { $d.Content.End }
        $n = $d.Range($debut, $fin).Characters.Count
        Ecrire ("p{0}={1}" -f $i, $n)
    }
    $d.Close($false)
    Ecrire 'FIN'
} catch { Ecrire ('ERREUR : ' + $_.Exception.Message) } finally { $w.Quit() }
