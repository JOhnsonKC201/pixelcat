// Ad-hoc codesign the macOS app bundle after electron-builder packs it.
//
// Why this exists, and why "unsigned" is not the same as "no signature":
//
// electron-builder unpacks Electron's official darwin build - which ships ad-hoc
// signed - and then renames Electron.app to pixelpets.app, renames the executable
// inside Contents/MacOS, rewrites Info.plist, swaps the icon and injects app.asar.
// Every one of those invalidates the bundle's _CodeSignature/CodeResources. With
// CSC_IDENTITY_AUTO_DISCOVERY=false, electron-builder 25 skips signing entirely and
// has no ad-hoc fallback, so what ships is not an unsigned app but a BROKEN-signed
// one. macOS treats those very differently:
//
//   unsigned          -> "unidentified developer", and the user can allow it
//   invalid signature -> "pixelpets is damaged and can't be opened. Move it to
//                        the Trash." - with no override, however they right-click
//
// So a beta tester following the README could not open the app at all. Re-signing
// ad-hoc ("-") costs nothing, needs no Apple Developer account, and restores the
// ordinary unidentified-developer flow. It also gives the bundle a stable identity
// for the things macOS keys to a code signature: the Accessibility (TCC) grant the
// input hook needs, the Keychain entry safeStorage puts the IMAP app-password in,
// and SMAppService login-item registration.
//
// This is NOT notarization. Gatekeeper still warns; the user still has to allow it
// once. A real Developer ID + notarize step is the proper fix when there is an
// Apple account to sign with, and this hook should be replaced by it rather than
// stacked with it.
const { execFileSync } = require('child_process');
const path = require('path');

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== 'darwin') return;      // windows/linux: nothing to do

  // electron-builder gives the packaged productName; fall back to the configured
  // one so a rename cannot silently make this a no-op.
  const name = (context.packager && context.packager.appInfo && context.packager.appInfo.productFilename) || 'pixelpets';
  const appPath = path.join(context.appOutDir, `${name}.app`);

  try {
    // --deep is deprecated for signing real identities but is correct and expected
    // for ad-hoc sealing a bundle that contains framework and helper bundles.
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', appPath], { stdio: 'inherit' });
    execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'inherit' });
    console.log(`[adhoc-sign] sealed ${appPath}`);
  } catch (e) {
    // Fail the build rather than ship the "damaged" bundle: a release that cannot
    // be opened is worse than a release that did not happen.
    throw new Error(`[adhoc-sign] could not ad-hoc sign ${appPath}: ${e.message}`, { cause: e });
  }
};
