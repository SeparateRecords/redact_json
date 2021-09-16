# Redact JSON

Super small Deno library & CLI to redact JSON. Takes input over stdin, outputs over
stdout. Doesn't require any permissions.

```bash
deno install -qfn redact https://deno.land/x/redact_json/cli.ts
```

## Using the CLI

The CLI can output some instructions, along with examples.

```sh
redact --help
```

###### POSIX Shell (macOS and Linux)

This sets the script's stdin to the input file, and stdout to the output file.

```sh
redact < raw.json > redacted.json
```

###### PowerShell (Windows)

In PowerShell, you have to use a cmdlet to read the file and pipe it to the script.

```powershell
Get-Content raw.json | redact > redacted.json
```

## Using the library

There's also a simple example that shows you the input and output.

```
deno run https://deno.land/x/redact_json/example.ts
```

Here's a simple example that's equivalent to the CLI examples above.

`./raw.json` is read, redacted, and written to `./redacted.json`

`redact` is pure, and fully typed. It takes a `JSONValue` and outputs a `JSONValue`. It
won't mutate the input value, but for various reasons, that can't be enforced through
the type system (yet).

`JSON.parse` returns `JSONFile`, so that can help you with adding types to your
variables.

```javascript
import { JSONFile, redact } from "https://deno.land/x/redact_json/mod.ts";

const text = await Deno.readTextFile("raw.json");
const json = JSON.parse(text) as JSONFile;

const redacted = redact(json);

const output = JSON.stringify(redacted);
await Deno.writeTextFile("redacted.json", output);
```
