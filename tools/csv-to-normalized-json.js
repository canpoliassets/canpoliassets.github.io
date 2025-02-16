import * as CSV from "jsr:@std/csv";
import parties from "../data/parties.json" with { type: "json" };

const members = CSV.parse(await Deno.readTextFile("./data/members.csv"), {
	skipFirstRow: true,
	columns: ["name", "province", "riding", "party", "homeowner", "landlord", "investments", "portfolio"],
});

const partyKeys = Object.keys(parties);

for (const member of members) {
	const partyId = partyKeys.find(key => parties[key].long === member.party);
	member.party = partyId;
	for (const key of ["homeowner", "landlord", "investmests"]) {
		member[key] = member[key] === "Y" ? "yes" : member[key] === "N" ? "no" : member[key]?.toLowerCase();
	}
}

await Deno.writeTextFile("./data/members.json", JSON.stringify(members));
