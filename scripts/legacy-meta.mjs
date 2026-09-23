// Writes a legacy meta.json next to manifest.json in a build output folder.
//
//   node scripts/legacy-meta.mjs dist/web-client/browser
//
// App builds from before the manifest read the installed client's version from meta.json and
// report anything without one as "Custom". Generating it from the manifest keeps those builds
// working without a third file to keep in sync. Drop it once those app versions have aged out.

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const [directory] = process.argv.slice(2)
if (directory === undefined) {
  console.error('Usage: node scripts/legacy-meta.mjs <build folder>')
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(join(directory, 'manifest.json'), 'utf8'))

const meta = {
  name: manifest.name,
  version: manifest.version,
  description: manifest.description,
  author: manifest.authors?.map((author) => author.name).join(', '),
  url: manifest.repository ?? manifest.website
}

writeFileSync(join(directory, 'meta.json'), JSON.stringify(meta, null, 4) + '\n')
console.log(`Wrote ${join(directory, 'meta.json')} for ${meta.version}`)
