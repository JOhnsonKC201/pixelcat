' Silent launcher for pixelpets (runs the app from source with the latest code, no
' packaging needed). Launched by the desktop shortcut. Window style 0 = hidden.
'
' Paths are derived from THIS script's own location instead of being hard-coded, so
' moving or renaming the project folder cannot silently break the launcher again -
' which is exactly what happened when C:\pixelcat became C:\pixel_pet.
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
electron = fso.BuildPath(root, "node_modules\electron\dist\electron.exe")

' Say what is wrong rather than failing mute: a missing electron means the deps were
' never installed in this copy, which looks identical to "the pet just didn't start".
If Not fso.FileExists(electron) Then
  MsgBox "pixelpets could not start: electron is missing at" & vbCrLf & vbCrLf & _
         electron & vbCrLf & vbCrLf & "Run  npm install  in " & root & vbCrLf, _
         vbExclamation, "pixelpets"
  WScript.Quit 1
End If

Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = root
sh.Run """" & electron & """ """ & root & """", 0, False
