param($dir,$out)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Globalization.Language,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Storage.StorageFile,Windows.Foundation,ContentType=WindowsRuntime]
$am=([System.WindowsRuntimeSystemExtensions].GetMethods()|?{$_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'})[0]
function Aw($op,$t){$m=$am.MakeGenericMethod($t);$x=$m.Invoke($null,@($op));$x.Wait();$x.Result}
$eng=[Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage([Windows.Globalization.Language]::new('es-ES'))
$res=@{}
foreach($f in (Get-ChildItem $dir -Filter *.png)){
  $file=Aw ([Windows.Storage.StorageFile]::GetFileFromPathAsync($f.FullName)) ([Windows.Storage.StorageFile])
  $st=Aw ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
  $dec=Aw ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($st)) ([Windows.Graphics.Imaging.BitmapDecoder])
  $bmp=Aw ($dec.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
  $r=Aw ($eng.RecognizeAsync($bmp)) ([Windows.Media.Ocr.OcrResult])
  $res[$f.BaseName]=@($r.Lines|%{$l=$_;$ws=@($l.Words);$x0=($ws|%{$_.BoundingRect.X}|Measure-Object -Minimum).Minimum;$y0=($ws|%{$_.BoundingRect.Y}|Measure-Object -Minimum).Minimum;$x1=($ws|%{$_.BoundingRect.X+$_.BoundingRect.Width}|Measure-Object -Maximum).Maximum;$y1=($ws|%{$_.BoundingRect.Y+$_.BoundingRect.Height}|Measure-Object -Maximum).Maximum;@{t=$l.Text;x=$x0;y=$y0;x1=$x1;y1=$y1}})
}
$res|ConvertTo-Json -Depth 5|Out-File $out -Encoding utf8
