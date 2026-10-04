import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('..', import.meta.url));
const ng = path.join(root, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');

function run(label, args, summarize = () => label) {
  const result = spawnSync(process.execPath, [ng, ...args], {
    cwd: root,
    env: process.env,
    encoding: 'utf8'
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;

  if (result.status !== 0) {
    process.stderr.write(`Verification failed: ${label}\n${output}`);
    process.exit(result.status ?? 1);
  }

  console.log(`✓ ${summarize(output)}`);
}

run(
  'unit tests',
  ['test', '--watch=false', '--progress=false', '--reporters=dots'],
  output => {
    const match = output.match(/Executed (\d+) of \1 SUCCESS/);
    return match ? `${match[1]} unit tests` : 'unit tests';
  }
);
run('production build', ['build', '--configuration', 'production', '--progress=false']);
