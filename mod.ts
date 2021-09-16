import { mapEntries } from "https://deno.land/std@0.107.0/collections/map_entries.ts";
import shuffle from "https://deno.land/x/shuffle@v1.0.0/mod.ts";

export type JSONValue =
	| string
	| number
	| boolean
	| null
	| JSONArray
	| JSONObject;

export type JSONArray = JSONValue[];
export type JSONObject = { [key: string]: JSONValue };

export type JSONFile = JSONArray | JSONObject;

/**
 * Scale a number so that 0 is `min` (0.1) and 1 is `max` (0.8).
 */
function scale(n: number, { min = 0.1, max = 0.8 } = {}) {
	return (max - min) * n + min;
}

export interface RedactOptions {
	/**
	 * A set of object keys for which the value will not be redacted.
	 */
	readonly preserveKeys?: ReadonlySet<string>;

	/**
	 * A set of object keys for which, if the value is an array, between 10%
	 * and 80% of the values in the array will be deleted.
	 */
	readonly pruneKeys?: ReadonlySet<string>;

	/**
	 * A set of object keys for which, if the value is an array, the array
	 * will be shuffled.
	 */
	readonly shuffleKeys?: ReadonlySet<string>;

	/**
	 * The value to replace strings with. Defaults to "[redacted]".
	 */
	readonly string?: string;

	/**
	 * The value to replace numbers with. Defaults to 0.
	 */
	readonly number?: number;

	/**
	 * The value to replace booleans with. Defaults to false.
	 */
	readonly boolean?: boolean;
}

type RedactConfig = Required<RedactOptions>;

/**
 * Recursively replace values in a JSON object with a known value of the same type.
 * This will not mutate the input object.
 *
 * - `null` will not be changed.
 * - Strings will be set to `"[redacted]"`
 * - Numbers will be set to `0`
 * - Booleans will be set to `false`
 * - Arrays will have the values redacted recursively.
 * - Objects will have their items redacted recursively. The keys will not be changed.
 *
 * An options bag can be provided with a set of object keys to preserve (don't redact
 * the value when the key is encountered) and object keys to prune (when the value
 * is an array, prune it).
 *
 * For a pruned array, each value has between a 10% and 80% chance of being removed
 * from the output.
 */
export function redact(
	item: JSONValue,
	options: RedactOptions = {},
): JSONValue {
	const config: RedactConfig = {
		preserveKeys: options.preserveKeys ?? new Set(),
		pruneKeys: options.pruneKeys ?? new Set(),
		shuffleKeys: options.shuffleKeys ?? new Set(),
		string: options.string ?? "[redacted]",
		number: options.number ?? 0,
		boolean: options.boolean ?? false,
	};
	return redactValue(item, config);
}

function redactValue(
	item: JSONValue,
	config: RedactConfig,
): JSONValue {
	switch (typeof item) {
		case "string": {
			return config.string;
		}
		case "number": {
			return config.number;
		}
		case "boolean": {
			return config.boolean;
		}
		case "object": {
			if (item === null) {
				return null;
			}
			if (Array.isArray(item)) {
				return redactArray(item, config);
			}
			return redactObject(item, config);
		}
	}
}

function redactArray(item: JSONArray, config: RedactConfig) {
	return item.map((value) => redactValue(value, config));
}

function redactObject(item: JSONObject, config: RedactConfig): JSONObject {
	return mapEntries(item, ([key, value]) => {
		return redactObjectEntry(key, value, config);
	});
}

function redactObjectEntry(
	key: string,
	value: JSONValue,
	config: RedactConfig,
): [string, JSONValue] {
	// This percentage is the same for each value in the array, so it
	// can't be generated inside the filter callback.
	const percentChanceToDelete = scale(Math.random());

	// Whether the element should be deleted is also random. Assuming
	// Math.random outputs a uniform distribution of numbers between
	// zero and one, over a large enough array the number of elements
	// deleted will approach percentChanceToDelete. It's less effort :p
	const filtered = config.pruneKeys.has(key) && Array.isArray(value)
		? value.filter(() => Math.random() > percentChanceToDelete)
		: value;

	const shuffled = config.shuffleKeys.has(key) && Array.isArray(filtered)
		? shuffle(filtered)
		: filtered;

	return config.preserveKeys.has(key)
		? [key, shuffled]
		: [key, redactValue(shuffled, config)];
}
