import { JSONFile, redact } from "./mod.ts";

const data: JSONFile = {
	sensitiveString: "Don't show this to anyone!",
	annualIncome: 1_000_000,
	anotherObject: {
		isEmployed: true,
	},
	secretArray: [
		{ key: "value" },
		{ cool: true },
		{ friends: 9000 },
	],
	tenItems: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
};

console.log("\nconst data =", data);

alert("Continue");

console.log(`----------------

Here's the configuration for how the data will be redacted.
These are equivalent.

Command-line:

    redact --prune=tenItems \\
           --shuffle=tenItems,secretArray \\
           --preserve=friends,tenItems

JavaScript:

    redact(data, {
      pruneKeys: new Set(["tenItems"]),
      shuffleKeys: new Set(["tenItems", "secretArray"]),
      preserveKeys: new Set(["friends", "tenItems"]),
    })

Arrays under the key 'tenItems' will be shuffled and pruned, but not redacted.
Arrays under the key 'secretArray' will be shuffled.
Values under the key 'friends' will not be redacted.

`);

alert("Continue");

console.log("----------------\n");

console.log(redact(data, {
	pruneKeys: new Set(["tenItems"]),
	shuffleKeys: new Set(["tenItems", "secretArray"]),
	preserveKeys: new Set(["friends", "tenItems"]),
}));

console.log(`

If you run this example again, you'll get a different result.

`);
