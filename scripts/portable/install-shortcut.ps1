param(
  [string]$BundleRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [string]$ShortcutName = 'muStatistics Portable'
)

$BundleRoot = [string]$BundleRoot
$BundleRoot = $BundleRoot.Trim().Trim('"')
$BundleRoot = [System.IO.Path]::GetFullPath($BundleRoot)

$shell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop ($ShortcutName + '.lnk')
$targetPath = Join-Path $BundleRoot 'start-portable.cmd'

$shortcut = $shell.CreateShortcut($shortcutPath)
$shortcut.TargetPath = $targetPath
$shortcut.WorkingDirectory = $BundleRoot
$shortcut.IconLocation = "$env:SystemRoot\System32\SHELL32.dll,220"
$shortcut.Save()

Write-Host "Created desktop shortcut at $shortcutPath"
