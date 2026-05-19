#!/usr/bin/env node
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Command } from 'commander';
import { scan } from './scan.js';
import { toJson, toMarkdown } from './report.js';

const program = new Command();

program
  .name('mosaic-migrate')
  .description('Scan an existing site for Mosaic adoption opportunities.')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan a site directory and write a migration report.')
  .argument('<path>', 'site root to scan')
  .option('-o, --out-md <file>', 'output markdown path', 'mosaic-migration-report.md')
  .option('-j, --out-json <file>', 'output JSON path', 'mosaic-migration-report.json')
  .option('--stdout', 'print markdown report to stdout instead of writing files', false)
  .action(async (path: string, opts: { outMd: string; outJson: string; stdout: boolean }) => {
    const root = resolve(path);
    const result = await scan(root);
    const md = toMarkdown(result);
    const json = toJson(result);

    if (opts.stdout) {
      process.stdout.write(md);
      return;
    }

    const mdOut = resolve(process.cwd(), opts.outMd);
    const jsonOut = resolve(process.cwd(), opts.outJson);
    await writeFile(mdOut, md, 'utf8');
    await writeFile(jsonOut, json, 'utf8');

    process.stdout.write(
      `Mosaic migration scan: ${result.fileCount} files, ${result.findings.length} findings.\n` +
      `  Markdown: ${mdOut}\n` +
      `  JSON:     ${jsonOut}\n`,
    );
  });

program.parseAsync(process.argv).catch((err) => {
  process.stderr.write(`mosaic-migrate: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
