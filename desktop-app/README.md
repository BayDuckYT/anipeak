# MahoraPeak Desktop

Windows desktop shell for the live MahoraPeak site, with a bundled offline library and chapter reader.

## Development

```powershell
npm install
npm run desktop:dev
```

## Windows installer

```powershell
npm run desktop:build
```

The installer is written under `src-tauri/target/release/bundle/nsis/`. Building it on Windows requires the Microsoft C++ Build Tools (MSVC linker and Windows SDK) and WebView2. The NSIS bundle uses the current-user install mode.

Offline chapters are stored in the app's OS-managed app-data directory. Downloads are limited to the site's public R2 image host and are capped at 500 MB per chapter.

The live site security policy must include the Tauri IPC endpoints for the native download button to work. The corresponding `connect-src` additions are in the root site's `index.html` and `public/_headers`; deploy those site changes before using chapter downloads from the hosted site.
