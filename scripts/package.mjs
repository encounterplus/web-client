// Packs the production build into dist/web-client.zip, the archive Encounter+ installs.
//
//   node scripts/package.mjs
//
// Run after `npm run build:prod`, or use `npm run package` to do both. The release workflow
// uses this script as well, so a local package matches a released one.
//
// The app unzips the archive straight into its client folder, so the zip holds the contents
// of the build folder, with index.html at its root.

import { existsSync, rmSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const buildDir = join(root, 'dist', 'web-client', 'browser')
const archive = join(root, 'dist', 'web-client.zip')

for (const file of ['index.html', 'manifest.json']) {
  if (!existsSync(join(buildDir, file))) {
    console.error(`${join(buildDir, file)} is missing — run \`npm run build:prod\` first`)
    process.exit(1)
  }
}

// older app builds read the installed version from meta.json
const meta = spawnSync(process.execPath, [join(root, 'scripts', 'legacy-meta.mjs'), buildDir], { stdio: 'inherit' })
if (meta.status !== 0) {
  process.exit(meta.status ?? 1)
}

// zip adds to an existing archive rather than replacing it
rmSync(archive, { force: true })

const zip = spawnSync('zip', ['-r', '-X', '-q', archive, '.', '-x', '*.DS_Store'], { cwd: buildDir, stdio: 'inherit' })
if (zip.error) {
  console.error(`Unable to run zip: ${zip.error.message}`)
  process.exit(1)
}
if (zip.status !== 0) {
  process.exit(zip.status ?? 1)
}

console.log(`Wrote ${archive}`)
