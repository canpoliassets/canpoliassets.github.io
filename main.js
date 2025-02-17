/* Data */
import parties from "./data/parties.json" with { type: "json" };
import members from "./data/members.json" with { type: "json" };
import provinces from "./data/provinces.json" with { type: "json" };

/* Translations */
import en from "./translations/en.json" with { type: "json" };
import fr from "./translations/fr.json" with { type: "json" };

/* App */
import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { renderFile } from "pug";
import rosetta from "rosetta";

const i18n = rosetta({ en, fr });

i18n.locale("en");

const app = new Hono();

app.on("GET", ["/en/members", "/fr/deputes"], (c, next) => {
	const partyId = c.req.query("party");
	const party = parties[partyId];
	const provinceId = c.req.query("province");
	const province = provinces[provinceId];
	const searchParams = new URLSearchParams(c.req.url);
	const homeowner = searchParams.has("homeowner");
	const landlord = searchParams.has("landlord");
	const investments = searchParams.has("investments");

	const lang = c.req.path === "/en/members" ? "en" : c.req.path === "/fr/deputes" ? "fr" : null;

	if (lang == null) throw "No translation found";

	i18n.locale(lang);

	// experimental
	const asTable = searchParams.has("table");
	const provinceSort = c.req.query("province-sort");


	return c.html(
		renderFile("./views/members.pug", {
			t() {
				return i18n.t(...arguments);
			},
			title: i18n.t("members"),
			asTable,
			members: members.filter((member) => !(
				(party && member.party !== partyId) ||
				(province && member.province !== provinceId) ||
				(homeowner && member.homeowner !== "yes") ||
				(landlord && member.landlord !== "yes") ||
				(investments && member.investments !== "yes")
			)),
			parties,
			// TODO: sort correctly for français
			provinces,
			selectedProvince: provinceId in provinces ? provinceId : null,
			selectedParty: partyId in parties ? partyId : null,
			homeowner,
			landlord,
			lang,
			languageSwap: {
				label: lang === "en" ? "Français" : lang === "fr" ? "English" : null,
				url: lang === "en" ? "/fr/deputes" : lang === "fr" ? "/en/members" : null,
			},
		}),
	);
});

app.use(serveStatic({ root: "./public" }));

Deno.serve(app.fetch);
