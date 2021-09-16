#!/usr/bin/env deno

import * as flags from "https://deno.land/std@0.107.0/flags/mod.ts";
import * as colors from "https://deno.land/std@0.107.0/fmt/colors.ts";
import { readAll } from "https://deno.land/std@0.107.0/io/util.ts";
import { tagApply } from "https://crux.land/tag_apply@1.0.0";
import { JSONFile, redact } from "./mod.ts";

type Colors = typeof colors;
type ColorsItems = keyof Colors;

type TextStyle = {
	[K in ColorsItems]: Colors[K] extends (str: string) => string ? K
		: never;
}[ColorsItems];

/** Colorize text (if appropriate to do so) */
export const colorize = tagApply<[string, ...TextStyle[]], string>(
	([string, ...names]) =>
		!Deno.noColor && Deno.isatty(Deno.stdout.rid)
			? names.reduce((str, color) => colors[color](str), string)
			: string,
);

// deno-fmt-ignore
const helpText = colorize`
Preserve privacy by redacting JSON values.
This script takes UTF-8 JSON over stdin and outputs UTF-8 JSON over stdout.

${["OPTIONS:", "bold"]}

  -h, --help              Show this message.

      --string=<str>      Use this value for strings.  [default: "[redacted]"]

      --number=<num>      Use this value for numbers.  [default: 0]

      --boolean=<bool>    Use this value for booleans. [default: false]

  -k, --preserve=<keys>   Comma-separated list of keys to not redact the value.
                          Eg.  --preserve${["=", "dim"]}code,type,enrollType

  -d, --prune=<keys>      Comma-separated list of keys of arrays to prune.
                          Eg.  --prune${["=", "dim"]}devices,deviceGroups,users,userGroups

  -s, --shuffle=<keys>    Comma-separated list of keys of arrays to shuffle.
                          Eg.  --shuffle${["=", "dim"]}devices,deviceGroups,users,userGroups

  -p, --pretty            Pretty-print the output with JSON.stringify.


${["NOTES:", "bold"]}

 o  Pruning means each item in an array has between a 10% and 80% chance of
    being removed. This percentage changes between arrays. Note that because
    ${["each element", "italic"]} has a chance of being deleted, you shouldn't use this
    for small arrays.

 o  Preserving a key means its value won't be redacted. If a key is to be
    preserved ${["and", "italic"]} pruned, it will be pruned and the remaining values will not
    be changed.

 o  Pruning arrays uses 'Math.random', so setting the seed with
    'deno run --seed=<seed>' ${["should", "italic"]} produce deterministic output (untested)

 o  Pretty-printing is supported using JSON.stringify, but is not recommended.
    Instead, pipe into 'deno fmt --ext=json -' for a nicer looking result.

 o  You can import 'redact' from this module to use it programmatically. See
    the ${["EXAMPLES", "underline"]} section below.

 o  This script requires no permissions, it reads stdin and writes to stdout.


${["EXAMPLES:", "bold"]}

${["POSIX shell (Linux, macOS):", "underline"]}

  ${["$", "dim"]} deno run scripts/redact.js < data.json > anon.json

${["PowerShell (Windows):", "underline"]}

  ${["PS C:\\>", "dim"]} Get-Content data.json | deno run scripts\\redact.js > anon.json

${["Preserve certain keys:", "underline"]}

  ${["$", "dim"]} deno run scripts/redact.js --preserve=teacher,parent < data.json

${["Prune between 10% and 80% of values in specific arrays:", "underline"]}

  ${["$", "dim"]} deno run scripts/redact.js --prune=devices,groups < data.json

${["Format the output:", "underline"]}

  ${["$", "dim"]} deno run scripts/redact.js < data.json | deno fmt --ext=json -

${["Redact data in JavaScript:", "underline"]}

  import { redact } from "./scripts/redact.js";
  redact({ a: "abc", b: "def", c: true }, { preserveKeys: new Set(["a"]) })
  //=> { a: "abc", b: "[redacted]", c: false }

`.slice(1);

async function main() {
	const argv = flags.parse(Deno.args, {
		boolean: ["help", "pretty", "boolean"],
		string: ["preserve", "prune", "shuffle", "string", "number"],
		default: {
			string: "[redacted]",
			number: "0",
			boolean: false,
		},
		alias: {
			help: "h",
			pretty: "p",
			preserve: "k",
			prune: "d",
			shuffle: "s",
		},
	});

	const help: boolean = argv.help;
	const pretty: boolean = argv.pretty;
	const string: string = argv.string;
	const number: number = parseFloat(argv.number);
	const boolean: boolean = argv.boolean;
	const preserveKeys: Set<string> = new Set(argv.preserve?.split(","));
	const pruneKeys: Set<string> = new Set(argv.prune?.split(","));
	const shuffleKeys: Set<string> = new Set(argv.shuffle?.split(","));

	if (help || Deno.isatty(Deno.stdin.rid)) {
		console.log(helpText);
		Deno.exit(0);
	}

	if (Number.isNaN(number) || !Number.isFinite(number)) {
		console.error("Error: --number must be a finite number");
		Deno.exit(1);
	}

	const stdin = new TextDecoder().decode(await readAll(Deno.stdin));
	const json = JSON.parse(stdin) as JSONFile;

	const redactedObject = redact(json, {
		preserveKeys,
		pruneKeys,
		shuffleKeys,
		string,
		number,
		boolean,
	});
	const redactedText = JSON.stringify(
		redactedObject,
		null, // no replacer
		pretty ? 2 : undefined, // only indent if --pretty
	);

	console.log(redactedText);
	Deno.exit(0);
}

if (import.meta.main) {
	await main();
}
