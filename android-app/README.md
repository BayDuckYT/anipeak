# MahoraPeak Android

Android companion app for `https://mahorapeak.com.tr/`. The app keeps the live site experience in a mobile WebView and adds native offline recovery, Android notifications, file downloads, and update delivery from GitHub Android releases.

## Offline use

- If the site cannot be reached, the app opens its own offline home instead of a browser error page.
- Downloaded files are grouped into series in the offline library, sorted by chapter number where it can be read from the filename, and can be opened or removed from the device.
- Files initiated as downloads by the site use Android Download Manager and remain on the device. Only items that the site exposes as downloadable files are saved; the app does not scrape or copy protected reader pages.

## Mobile reader

- Tapping the left or right edge moves one reading step (about 82% of the screen height) backward or forward; normal vertical swiping remains available.
- Volume Up/Down moves forward/back while a chapter is open. The reader toolbar can disable this so the hardware keys control media volume again.
- A compact reader toolbar shows page progress, opens the chapter list and disappears after a short pause.
- The app remembers the scroll position separately for each chapter and keeps the screen awake while reading.

## In-app updates

On launch the app checks GitHub releases tagged `android-v*`; desktop releases are ignored. When a newer APK exists, it offers the update, downloads the signed APK, and opens Android's package installer. Android asks the user to confirm installation. Each update must use the same signing key and a higher `versionCode`.

The GitHub Actions workflow `.github/workflows/android-release.yml` builds and publishes `mahorapeak-android.apk` when an `android-v*` tag is pushed. Its signing key is kept in encrypted repository Actions secrets and is never committed to the repository.

## Build

Install Android Studio / Android SDK and set `local.properties` to the SDK path, then run:

```powershell
./gradlew.bat :app:assembleDebug
```

The APK is written to `app/build/outputs/apk/debug/app-debug.apk`.
