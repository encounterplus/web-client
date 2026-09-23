// Keeps src/manifest.json in step with package.json, which owns the version.
//
//   node scripts/sync-version.mjs             copy the package.json version into the manifest
//   node scripts/sync-version.mjs --check     fail unless both versions agree
//   node scripts/sync-version.mjs --check TAG fail unless both versions agree with TAG
//
// The plain form runs from the npm "version" lifecycle hook, so `npm version <x>` bumps both
// files in one commit. The --check form guards the release workflow.

import { readFileSync, writeFileSync } from 'node:fs'

const packageURL = new URL('../package.json', import.meta.url)
const manifestURL = new URL('../src/manifest.json', import.meta.url)

const packageVersion = JSON.parse(readFileSync(packageURL, 'utf8')).version
const manifest = JSON.parse(readFileSync(manifestURL, 'utf8'))

const [mode, tag] = process.argv.slice(2)

if (mode === '--check') {
  const versions = { 'package.json': packageVersion, 'src/manifest.json': manifest.version }
  if (tag !== undefined) {
    versions['tag'] = tag.replace(/^v/, '')
  }

  const distinct = new Set(Object.values(versions))
  if (distinct.size !== 1) {
    const listing = Object.entries(versions).map(([source, version]) => `  ${source}: ${version}`).join('\n')
    console.error(`Version mismatch:\n${listing}`)
    process.exit(1)
  }

  console.log(`Version ${packageVersion} is consistent`)
} else if (mode === undefined) {
  if (manifest.version !== packageVersion) {
    manifest.version = packageVersion
    writeFileSync(manifestURL, JSON.stringify(manifest, null, 4) + '\n')
  }
  console.log(`src/manifest.json is at ${packageVersion}`)
} else {
  console.error(`Unknown option: ${mode}`)
  process.exit(1)
}
