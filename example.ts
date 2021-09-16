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

console.log(data);
console.log();
console.log("This output is equivalent to the following options:");
console.log(
	"redact --prune=secretArray --shuffle=tenItems,secretArray --preserve=friends",
);
console.log();
console.log(redact(data, {
	pruneKeys: new Set(["tenItems"]),
	shuffleKeys: new Set(["tenItems", "secretArray"]),
	preserveKeys: new Set(["friends"]),
}));
