Add-Type -AssemblyName System.Drawing
function Resize-Image {
    param($Source, $Destination, $Size)
    $img = [System.Drawing.Image]::FromFile($Source)
    $bmp = New-Object System.Drawing.Bitmap($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $Size, $Size)
    $g.Dispose()
    $bmp.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $img.Dispose()
}

$sizes = @{
    "mdpi" = 48
    "hdpi" = 72
    "xhdpi" = 96
    "xxhdpi" = 144
    "xxxhdpi" = 192
}

$sourceFile = "C:\Users\srira\Dharaniherbbals\app_icon_new.png"

foreach ($res in $sizes.Keys) {
    $size = $sizes[$res]
    $dir = "C:\Users\srira\Dharaniherbbals\android\app\src\main\res\mipmap-$res"
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
    Resize-Image -Source $sourceFile -Destination "$dir\ic_launcher.png" -Size $size
    Resize-Image -Source $sourceFile -Destination "$dir\ic_launcher_round.png" -Size $size
}

Write-Output "Icons generated successfully for Android!"
