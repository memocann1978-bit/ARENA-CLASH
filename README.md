# ARENA CLASH

Windows desktop arena-card game prototype with offline bot battles and an online 1v1 server.

## Desktop development
- Node.js 22
- `npm install`
- `npm test` (JavaScript syntax checks)
- `npm start`

## Windows installer
GitHub Actions builds the Windows x64 NSIS installer on pushes to `main`.
Open Actions → Build Windows Game → latest successful run → Artifacts.

## Online server deployment
The online mode uses a separate authoritative Socket.IO server in `server/`.
The repository includes a Render Blueprint (`render.yaml`):
1. Sign in to Render and create a new Blueprint using this repository.
2. Deploy the `arena-clash-server` web service.
3. Wait for its health check at `/health` to pass.
4. Copy the service HTTPS URL.
5. In ARENA CLASH open **Çevrimiçi 1v1**, paste the URL, select **Sunucuya bağlan**, then **Rakip bul**.

The desktop client currently contains a placeholder server URL until the service is deployed. Online matchmaking requires the deployed service to be running and reachable. The free hosting tier may sleep when idle, so the first connection can take time.

## Publishing an auto-update
1. Update the version in `package.json` (for example `0.1.1`).
2. Commit and push to `main`.
3. Create a tag matching the package version, e.g. `v0.1.1`.
4. GitHub Actions builds and publishes a GitHub Release with `latest.yml` for electron-updater.

The updater checks GitHub Releases from a packaged build. Development builds do not self-update.

## Current implementation notes
- Offline mode: local player versus basic bot.
- Online mode: Socket.IO matchmaking, two-player rooms, server-side card placement validation, authoritative troop combat/tower health, match result events.
- The online server currently keeps player statistics in memory; accounts, durable cloud saves, ranked seasons, anti-cheat hardening, and production operations are not implemented yet.
- This is an actively developed early prototype, not a finished commercial game. Test online play with two clients after deploying the server.
