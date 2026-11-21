# ARENA CLASH

Windows desktop real-time card arena prototype.

## Development
- Node.js 22
- npm install
- npm start

## Windows installer
GitHub Actions builds the Windows x64 NSIS installer on pushes to `main`.
Open Actions → Build Windows Game → latest successful run → Artifacts to download the setup executable.

## Publishing an auto-update
1. Update the version in package.json (for example 0.1.1).
2. Commit and push to main.
3. Create and push a version tag matching the package version, e.g. `v0.1.1`.
4. GitHub Actions builds the installer and publishes a GitHub Release with latest.yml for electron-updater.

The updater checks GitHub Releases from an installed packaged build. Development builds do not self-update.
