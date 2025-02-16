/* Data */
import parties from "./data/parties.json" with { type: "json" };
import members from "./data/members.json" with { type: "json" };

/* App */
import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { renderFile } from "pug";

const app = new Hono();

app.get("/members", (c, next) => {
	const partyId = c.req.query("party");
	const party = parties[partyId];
	const searchParams = new URLSearchParams(c.req.url);
	const homeowner = searchParams.has("homeowner");
	const landlord = searchParams.has("landlord");
	const investments = searchParams.has("investments");

	// experimental
	const asTable = searchParams.has("table");

	return c.html(
		renderFile("./views/members.pug", {
			title: "Members",
			asTable,
			members: members.filter((member) => !(
				(party && member.party !== partyId) ||
				(homeowner && member.homeowner !== "yes") ||
				(landlord && member.landlord !== "yes") ||
				(investments && member.investments !== "yes")
			)),
			parties,
			selectedParty: partyId in parties ? partyId : null,
			homeowner,
			landlord,
		}),
	);
});

app.use(serveStatic({ root: "./public" }));

Deno.serve(app.fetch);
