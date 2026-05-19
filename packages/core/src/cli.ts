#!/usr/bin/env node
/**
 * mosaic — minimal CLI for the Node reference reader.
 *
 * Usage:
 *   mosaic validate <path>      Validate a folder against the spec (§§5–9)
 *   mosaic read <path>          Read a folder, print resolved JSON
 *   mosaic                      Print help
 *
 * No flags, no options, no third-party deps. The spec is the contract.
 */

import process from 'node:process';
import { validate } from './validate.js';
import { readFolder } from './reader.js';

const HELP = `mosaic — Mosaic folder reader (reference Node impl)

Usage:
  mosaic validate <path>    Validate a folder against the spec (§§5–9)
  mosaic read <path>        Read a folder, print resolved JSON (pipeline §12.5)

Examples:
  mosaic validate ./content
  mosaic read ./content | jq '.records'

Exit codes:
  0  success / valid
  1  validation errors
  2  usage error
`;

async function runValidate(target: string): Promise<number> {
  const result = await validate(target);
  for (const msg of result.errors) {
    console.error(`error   ${msg.path}: ${msg.message}`);
  }
  for (const msg of result.warnings) {
    console.warn(`warning ${msg.path}: ${msg.message}`);
  }
  const errCount = result.errors.length;
  const warnCount = result.warnings.length;
  const summary =
    errCount === 0
      ? warnCount === 0
        ? 'OK'
        : `OK (${warnCount} warning${warnCount === 1 ? '' : 's'})`
      : `FAIL (${errCount} error${errCount === 1 ? '' : 's'}, ${warnCount} warning${warnCount === 1 ? '' : 's'})`;
  console.error(summary);
  return errCount === 0 ? 0 : 1;
}

async function runRead(target: string): Promise<number> {
  const result = await readFolder(target);
  const out = {
    rootPath: result.rootPath,
    manifest: result.manifest,
    records: Object.fromEntries(result.records),
    warnings: result.warnings,
  };
  console.log(JSON.stringify(out, null, 2));
  return 0;
}

async function main(): Promise<number> {
  const [, , cmd, target] = process.argv;

  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    process.stdout.write(HELP);
    return cmd ? 0 : 2;
  }

  if (cmd !== 'validate' && cmd !== 'read') {
    console.error(`mosaic: unknown command "${cmd}". Run 'mosaic --help' for usage.`);
    return 2;
  }

  if (!target) {
    console.error(`mosaic: ${cmd} requires a path argument.`);
    return 2;
  }

  try {
    return cmd === 'validate' ? await runValidate(target) : await runRead(target);
  } catch (err) {
    console.error(
      `mosaic: ${cmd} failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    return 1;
  }
}

main().then((code) => process.exit(code));
