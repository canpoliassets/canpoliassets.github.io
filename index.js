import express from "express";
import { MongoClient } from "mongodb";
import path from "path";
import rosetta from "rosetta";

/* Translations */
import en from "./translations/en.json" with { type: "json" };
import fr from "./translations/fr.json" with { type: "json" };

const uri = process.env.MONGO_URI;

const dbClient = new MongoClient(uri);
const database = dbClient.db("public_gov");

const MPS = database.collection('mps'); // MP Data sourced from ourcommons.ca 
const SHEET_DATA = database.collection('sheet_data'); // Isaac's Sheet Data
const DISCLOSURES = database.collection('disclosures'); // Disclosures sourced from the ethics portal directly

const ONTARIO_MPPS = database.collection('ontario_mpps');
const ONTARIO_DISCLOSURES = database.collection('ontario_disclosures');

const ALBERTA_MLAS = database.collection('alberta_mlas');
const ALBERTA_DISCLOSURES = database.collection('alberta_disclosures');

const QUEBEC_MNAS = database.collection('quebec_mnas');
const QUEBEC_DISCLOSURES = database.collection('quebec_disclosures');

const NEWFOUNDLAND_MHAS = database.collection('newfoundland_mhas');
const NEWFOUNDLAND_DISCLOSURES = database.collection('newfoundland_disclosures');

const MANITOBA_MLAS = database.collection('manitoba_mlas');
const MANITOBA_DISCLOSURES = database.collection('manitoba_disclosures');

const NOVA_SCOTIA_MLAS = database.collection('nova_scotia_mlas');
const NOVA_SCOTIA_DISCLOSURES = database.collection('nova_scotia_disclosures');

const PEI_MLAS = database.collection('pei_mlas');
const PEI_DISCLOSURES = database.collection('pei_disclosures');

const NEW_BRUNSWICK_MLAS = database.collection('new_brunswick_mlas');
const NEW_BRUNSWICK_DISCLOSURES = database.collection('new_brunswick_disclosures');

const BRITISH_COLUMBIA_MLAS = database.collection('british_columbia_mlas');
const BRITISH_COLUMBIA_DISCLOSURES = database.collection('british_columbia_disclosures');

const SASKATCHEWAN_MLAS = database.collection('saskatchewan_mlas');
const SASKATCHEWAN_DISCLOSURES = database.collection('saskatchewan_disclosures');

const COLLATION = { collation : {locale: "fr_CA", strength: 2 }}

const app = express();

app.set('view engine', 'pug');

app.use((req, res, next) => {
    // Initialize localization
    req.i18n = rosetta({ en, fr });
    res.locals.t = req.i18n.t.bind(req.i18n),
    res.locals.currentPath = req.path;
    next();
});

app.use(express.static(path.join(import.meta.dirname, "./public")));

app.get("/", (req, res) => res.redirect(307, "/en"));

/* Permanent redirects for the old URLs */
app.get("/about", (_req, res) => res.redirect(301, "/en/about"));
app.get("/ontario", (_req, res) => res.redirect(301, "/en/on"));
app.get("/alberta", (_req, res) => res.redirect(301, "/en/ab"));
app.get("/quebec", (_req, res) => res.redirect(301, "/fr/qc"));

// These localized routes need to come after the non-localized ones or static files for now…

app.use("/:lang", (req, res, next) => {
    const { lang } = req.params;
    if (lang !== "en" && lang !== "fr") return res.status(404).send("Page not found");

    req.i18n.locale(lang);
    req.collator = new Intl.Collator(`${lang}-ca`).compare;

    res.locals.lang = lang;
    res.locals.formatPercentage = new Intl.NumberFormat(`${lang}-ca`, {
        style: "percent",
        trailingZeroDisplay: "stripIfInteger",
        minimumFractionDigits: 2,
    }).format;

    next();
});

/* ABOUT */

app.get(['/:lang/about', "/:lang/a-propos"], (req, res) => {
    const { lang } = req.params
    if (lang === "fr") return res.redirect(307, "/en/about");
    res.render('about', { title: 'About Us' });
});

/* FEDERAL */

app.get('/:lang', async (req, res) => {
    const { lang } = req.params;

    function getProvinceKey(province) {
        for (const key in en.provinces) if (en.provinces[key] === province) return key;
    }

    let members = await MPS.aggregate([
        {
            $lookup: {
                from: "sheet_data",
                localField: "name",
                foreignField: "name",
                as: "sheet_data_matches"
            },
        },
    ]).map(member => {
        for (const match of member.sheet_data_matches) {
            if (match.landlord === "Y") member.landlord = true;
            if (match.homeowner === "Y") member.homeowner = true;
            if (match.investor === "Y") member.investor = true;
        }
        member.province = getProvinceKey(member.province);

        return member;
    }).sort({ name: 1 }).toArray();

    const parties = Array.from(new Set(members.map(member => member.party)));
    // We’re taking advantage of the fact that this list is sorted by the
    // localized value in the respective file. If that changes, we should use
    // the collation function here to sort.
    const provinces = req.i18n.t("provinces");
    const constituenciesByProvince = Object.groupBy(
        members
            .map(member => ({
                name: member.constituency,
                slug: member.constituency_slug,
                province: member.province,
            }))
            .sort((a, b) => req.collator(a.province, b.province)),
        // Group by province
        entry => entry.province,
    );

    res.render('member-list', {
        title: req.i18n.t("siteTitle"),
        scope: "federal",
        portraitPath: "mp_images",
        members,
        provinces,
        constituenciesByProvince,
        parties,
        notices: req.i18n.t(`federal.notices`) ?? [],
    });
});

app.get('/:lang/federal/:constituency', async (req, res) => {
    const { constituency, lang } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/federal/${constituency}`)

    let mp = await MPS.findOne({ constituency_slug: constituency }, COLLATION);
    let { home_owner, landlord, investor } = await SHEET_DATA.findOne({ name: mp.name }, COLLATION);
    let disclosures = await DISCLOSURES.find({ name: mp.name }, COLLATION).sort({ category: 1 }).toArray();

    res.render('mp', {
        title: `${mp.name} | Member Details`,
        ...mp,
        home_owner,
        landlord,
        investor,
        groupedDisclosures: groupDisclosures(disclosures),
    });
});

const PROVINCES = {
    ab: {
        collection: ALBERTA_MLAS,
        portraitPath: "ab_mla_images",
        disclosureCollection: "alberta_disclosures",
        mapDisclosures: member => {
            for (const disclosure of member.disclosures) {
                // TODO: use a regex
                if (member.homeowner = disclosure.content === "property") member.homeowner = true;
                if (disclosure.content.includes("Rental Property") || disclosure.content.includes("Rental Income")) member.landlord = true;
                if (
                    disclosure.category.includes("Securities")
                    || disclosure.category.includes("Bonds & Certificates")
                    || disclosure.category.includes("Financial Assets")
                ) member.investor = true;
            }

            return member;
        },
    },
    on: {
        collection: ONTARIO_MPPS,
        portraitPath: "mpp_images",
        disclosureCollection: "ontario_disclosures",
        mapDisclosures: member => {
            for (const disclosure of member.disclosures) {
                if (
                    disclosure.category === "Assets" && (
                        disclosure.content.includes("securities")
                        || disclosure.content.includes("Shares")
                        || disclosure.content.includes("Investments and registered accounts")
                    )
                ) member.homeowner = true;
                if (
                    disclosure.category === "Income" &&
                    disclosure.content.includes("Rental")
                ) member.landlord = true;
                if (
                    (
                        disclosure.category === "Assets" && (
                            disclosure.content.includes("securities")
                            || disclosure.content.includes("Shares")
                            || disclosure.content.includes("Investments and registered accounts")
                        )
                    ) || (
                        disclosure.category === "Income" && disclosure.content.includes("Investment")
                    )
                ) member.investor = true;
            }
            return member;
        },
    },
    qc: {
        collection: QUEBEC_MNAS,
        portraitPath: "mna_images",
        disclosureCollection: "quebec_disclosures",
        mapDisclosures: member => {
            for (const disclosure of member.disclosures) {
                if (disclosure.content.includes('résidentielles personnelles')) member.homeowner = true;
                if (disclosure.content.includes("Revenu de location")) member.landlord = true;
                if (
                    disclosure.category.includes("Fiducie ou mandat sans droit de regard") ||
                    disclosure.category.includes("Entreprises, personnes, morales, sociétés et associations, mentionnées") ||
                    disclosure.category.includes("Succession ou fiducie, dont la ou le membre est bénéficiaire pour une valeur de 10 000 $ et plus")
                ) member.investor = true;
            }
            return member;
        },
    },
    nl: {
        collection: NEWFOUNDLAND_MHAS,
        portraitPath: "mha_images",
        disclosureCollection: "newfoundland_disclosures",
        mapDisclosures: member => {
            for (const disclosure of member.disclosures) {
                member.homeowner = true; // True per Isaac Peltz - we can implement proper filtering if NL government ever releases real data. . .
                if (disclosure.content.includes("rental")) member.landlord = true;
                if (disclosure.category.includes("Inc.")) member.investor = true;
            }
            return member;
        },
    },
    mb: {
        collection: MANITOBA_MLAS,
        portraitPath: "mb_mla_images",
        disclosureCollection: "manitoba_disclosures",
        mapDisclosures: member => {
            for (const disclosure of member.disclosures) { 
                if (disclosure.category.includes("(Spouse)")) {
                    continue
                }
                if (disclosure.category.includes("(Dependent)")) {
                    continue
                }
                if (disclosure.category.includes("Real Property Interests")) member.homeowner = true;
                if (disclosure.category.includes("Mortgages")) member.homeowner = true;

                if (disclosure.content.includes("Rental Property")) member.landlord = true;
                if (disclosure.content.includes("Rental income")) member.landlord = true;
                if (disclosure.content.includes("Rental\nProperty\n")) member.landlord = true;
                if (disclosure.content.includes("Rental property")) member.landlord = true;
                if (disclosure.content.includes("Secondary\nresidence")) member.landlord = true;
                if (disclosure.content.includes("rental\nproperty")) member.landlord = true; 
                if (disclosure.content.includes("RENTAL\nINCOME")) member.landlord = true; 
                if (disclosure.content.includes("Renters")) member.landlord = true; 

                
                if (disclosure.category.includes("Real Property Interests")) {
                    if (!disclosure.content.includes("**Deleted**") 
                        && !disclosure.content.startsWith("Boat")
                        && !disclosure.content.startsWith("Equipment used for farming")
                        && !disclosure.content.startsWith("Specialized equipment")) {
                        member.landlord = true; 
                        member.homeowner = true;
                        member.investor = true
                    }
                }
                
                if (disclosure.category.includes("Mutual Funds")) member.investor = true;   
                if (disclosure.category.includes("Private Business Interests")) member.investor = true;  
                if (disclosure.category.includes("Private Corporations")) member.investor = true;  
                if (disclosure.category.includes("Securities")) member.investor = true; 
            }
            return member;
        },
    },
    ns: {
        collection: NOVA_SCOTIA_MLAS,
        portraitPath: "ns_mla_images",
        disclosureCollection: "nova_scotia_disclosures",
        mapDisclosures: member => {
            for (const disclosure of member.disclosures) { 
                if (disclosure.category.includes("Property")) member.homeowner = true;
                if (disclosure.content.includes("Mortgage")) member.homeowner = true;
                if (disclosure.content.includes("Rental")) member.landlord = true;
                if (disclosure.content.includes("Landlord")) member.landlord = true;
                if (disclosure.category.includes("Property") &&
                !disclosure.content.includes("Home -")) member.landlord = true;
                if (disclosure.category.includes("Corporate Interests")) member.investor = true;
                if (disclosure.category.includes("Investments, Mutual Funds, Bonds & Other Securities")) member.investor = true;
                if (disclosure.category.includes("Trusts Held")) member.investor = true;
            }
            return member;
        },
    },
    pe: {
        collection: PEI_MLAS,
        portraitPath: "pe_mla_images",
        disclosureCollection: "pei_disclosures",
        mapDisclosures: member => {
            for (const disclosure of member.disclosures) { 
                if (disclosure['category'] == 'Assets' && disclosure['content'].includes('PID')) {
                    member.landlord = true;
                }
                if (disclosure['category'] == 'Offices & Directorships') {
                    member.investor = true;
                }
                if (disclosure['category'] == 'Assets' && !disclosure['content'].includes('PID')) {
                    member.investor = true;
                }
            }
            return member;
        },
    },
    nb: {
        collection: NEW_BRUNSWICK_MLAS,
        portraitPath: "nb_mla_images",
        disclosureCollection: "nb_disclosures",
        mapDisclosures: member => {
            return member;
        },
    },
    bc: {
        collection: BRITISH_COLUMBIA_MLAS,
        portraitPath: "bc_mla_images",
        disclosureCollection: "bc_disclosures",
        mapDisclosures: member => {
            return member;
        },
    },
    sk: {
        collection: SASKATCHEWAN_MLAS,
        portraitPath: "sk_mla_images",
        disclosureCollection: "sk_disclosures",
        mapDisclosures: member => {
            return member;
        },
    },
};

app.get("/:lang/:province", async (req, res, next) => {
    const { lang, province } = req.params;

    const DATA = PROVINCES[province];

    if (!DATA) return res.status(404).send("Page not found");

    const members = await DATA.collection.aggregate([
        {
            $lookup: {
                from: DATA.disclosureCollection,
                localField: "name",
                foreignField: "name",
                as: "disclosures",
            },
        },
    ]).map(DATA.mapDisclosures).sort({ name: 1 }).toArray();

    const parties = Array.from(new Set(members.map(member => member.party.startsWith("Indépendant") ? "Indépendant" : member.party)));

    const constituencies = members
        .map(member => ({ name: member.constituency, slug: member.constituency_slug }))
        .sort((a, b) => req.collator(a.name, b.name));

    res.render("member-list", {
        title: req.i18n.t(`${province}.title`),
        scope: province,
        portraitPath: DATA.portraitPath,
        members,
        parties,
        constituencies,
        notices: req.i18n.t(`${province}.notices`) ?? [],
    });
});

/* TODO: consolidate all individual member pages */
//app.get("/:lang/:province/:constituency", async (req, res, next) => {
//    const { lang, province, constituency } = req.params;
//
//    res.render("member", {});
//});

/* ONTARIO */

app.get('/:lang/on/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/on/${constituency_slug}`);

    let member = await ONTARIO_MPPS.findOne({ constituency_slug }, COLLATION);

    let disclosures = await ONTARIO_DISCLOSURES.find({ name: member.name }, COLLATION).sort({ category: 1 }).toArray();

    res.render('member', {
        title: 'Member Details',
        siteTitle: req.i18n.t("on.title"),
        portraitPath: "mpp_images",
        ...member,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: homeOwnerText(member.name, disclosures),
        landlord: landlordText(member.name, disclosures),
        investor: investorText(member.name, disclosures),
    });
});

/* ALBERTA */

app.get('/:lang/ab/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/ab/${constituency_slug}`);

    let mla = await ALBERTA_MLAS.findOne({ constituency_slug }, COLLATION);
    let disclosures = await ALBERTA_DISCLOSURES.find({ name: mla.name }, COLLATION).sort({ category: 1 }).toArray();

    let homeowner = false;
    let landlord = false;
    let investor = false;
    for (let i=0; i<disclosures.length;++i) {
        if (disclosures[i]['category'] == 'Property') {
            homeowner = true;
        }
        if (disclosures[i]['content'].includes("Rental Income")) {
            landlord = true;
        }
        if (disclosures[i]['content'].includes("Rental Property")) {
            landlord = true;
        }
        if (disclosures[i]['category'].includes("Securities")) {
            investor = true;
        }
        if (disclosures[i]['category'].includes("Bonds & Certificates")) {
            investor = true;
        }
        if (disclosures[i]['category'].includes("Financial Assets")) {
            investor = true;
        }
    }

    res.render('member', {
        title: 'Member Details',
        siteTitle: req.i18n.t("ab.title"),
        portraitPath: "ab_mla_images",
        ...mla,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: englishHomeTextGenerator(mla['name'], "Homeowner", homeowner),
        landlord: englishHomeTextGenerator(mla['name'], "Landlord", landlord),
        investor: englishInvestorTextGenerator(mla['name'], investor),
    });
});

/* QUEBEC */

app.get('/:lang/qc/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "en") return res.redirect(307, `/fr/qc/${constituency_slug}`);

    let mna = await QUEBEC_MNAS.findOne({ constituency_slug }, COLLATION);
    let disclosures = await QUEBEC_DISCLOSURES.find({ name: mna.name }, COLLATION).sort({ category: 1 }).toArray();

    let homeowner = false;
    let landlord = false;
    let investor = false;
    // Revenu de location = landlord
    // résidentielles personnelles = homeowner
    for (let i=0; i<disclosures.length;++i) {
        if (disclosures[i]['content'].includes('résidentielles personnelles')) {
            homeowner = true;
        }
        if (disclosures[i]['content'].includes("Revenu de location")) {
            landlord = true;
        }
        if (disclosures[i]['category'].includes("Fiducie ou mandat sans droit de regard")) {
            investor = true;
        }
        if (disclosures[i]['category'].includes("Entreprises, personnes, morales, sociétés et associations, mentionnées")) {
            investor = true;
        }
        if (disclosures[i]['category'].includes("Succession ou fiducie, dont la ou le membre est bénéficiaire pour une valeur de 10 000 $ et plus")) {
            investor = true;
        }
        if (disclosures[i]['category'].includes("Succession ou fiducie, dont la ou le membre est bénéficiaire pour une valeur de 10 000 $ et plus")) {
            investor = true;
        }
    }

    res.render('member', {
        siteTitle: req.i18n.t("ab.title"),
        title: 'Détails du Membre',
        ...mna,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: quebecHomeOwnerGenerator(mna['name'], homeowner),
        landlord: quebecLandlordGenerator(mna['name'], landlord),
        investor: quebecInvestorGenerator(mna['name'], investor),
    });
});

/* NEWFOUNDLAND & LABRADOR */
app.get('/:lang/nl/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/nl/${constituency_slug}`);

    let mha = await NEWFOUNDLAND_MHAS.findOne({ constituency_slug }, COLLATION);
    let disclosures = await NEWFOUNDLAND_DISCLOSURES.find({ name: mha.name }, COLLATION).sort({ category: 1 }).toArray();

    let homeowner = true; // This is true per Isaac Peltz - we can properly filter if the NL Government ever releases real data. . .
    let landlord = false;
    let investor = false;
    for (let i=0; i<disclosures.length;++i) {
        if (disclosures[i]['content'].includes("Inc.")) {
            investor = true;
        }
        if (disclosures[i]['content'].includes("rental")) {
            landlord = true;
        }
        if (disclosures[i]['content'].includes("residential")) {
            homeowner = true;
        }
    }

    res.render('member', {
        title: 'Member Details',
        siteTitle: req.i18n.t("nl.title"),
        portraitPath: "mha_images",
        ...mha,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: englishHomeTextGenerator(mha['name'], "Homeowner", homeowner),
        landlord: englishHomeTextGenerator(mha['name'], "Landlord", landlord),
        investor: englishInvestorTextGenerator(mha['name'], investor),
    });
});

/* MANITOBA */
app.get('/:lang/mb/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/mb/${constituency_slug}`);

    let mla = await MANITOBA_MLAS.findOne({ constituency_slug }, COLLATION);
    let disclosures = await MANITOBA_DISCLOSURES.find({ name: mla.name }, COLLATION).sort({ category: 1 }).toArray();

    let homeowner = false;
    let landlord = false;
    let investor = false;
    for (let i=0; i<disclosures.length;++i) {
        if (disclosures[i].category.includes("(Spouse)")) {
            continue
        }
        if (disclosures[i].category.includes("(Dependent)")) {
            continue
        }
        if (disclosures[i].category.includes("Mortgages")) homeowner = true;

        if (disclosures[i].content.includes("Rental Property")) landlord = true;
        if (disclosures[i].content.includes("Rental income")) landlord = true;
        if (disclosures[i].content.includes("Rental\nProperty\n")) landlord = true;
        if (disclosures[i].content.includes("Rental property")) landlord = true;
        if (disclosures[i].content.includes("Secondary\nresidence")) landlord = true;
        if (disclosures[i].content.includes("rental\nproperty")) landlord = true; 
        if (disclosures[i].content.includes("RENTAL\nINCOME")) landlord = true; 
        if (disclosures[i].content.includes("Renters")) landlord = true; 

        if (disclosures[i].category.includes("Real Property Interests")) {
            if (!disclosures[i].content.includes("**Deleted**") 
                && !disclosures[i].content.startsWith("Boat")
                && !disclosures[i].content.startsWith("Equipment used for farming")
                && !disclosures[i].content.startsWith("Specialized equipment")) {
                landlord = true; 
                homeowner = true;
                investor = true;
            }
        }
        
        if (disclosures[i].category.includes("Mutual Funds")) investor = true;   
        if (disclosures[i].category.includes("Private Business Interests")) investor = true;  
        if (disclosures[i].category.includes("Private Corporations")) investor = true;  
        if (disclosures[i].category.includes("Securities")) investor = true; 
    }

    res.render('member', {
        title: 'Member Details',
        siteTitle: req.i18n.t("mb.title"),
        portraitPath: "mb_mla_images",
        ...mla,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: englishHomeTextGenerator(mla['name'], "Homeowner", homeowner),
        landlord: englishHomeTextGenerator(mla['name'], "Landlord", landlord),
        investor: englishInvestorTextGenerator(mla['name'], investor),
    });
});

/* NOVA SCOTIA */
app.get('/:lang/ns/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/ns/${constituency_slug}`);

    let mla = await NOVA_SCOTIA_MLAS.findOne({ constituency_slug }, COLLATION);
    let disclosures = await NOVA_SCOTIA_DISCLOSURES.find({ name: mla.name }, COLLATION).sort({ category: 1 }).toArray();

    let homeowner = false;
    let landlord = false;
    let investor = false;
    for (let i=0; i<disclosures.length;++i) {
        if (disclosures[i]['category'].includes("Property")) homeowner = true;
        if (disclosures[i]['content'].includes("Mortgate")) homeowner = true;
        if (disclosures[i]['content'].includes("Rental")) landlord = true;
        if (disclosures[i]['content'].includes("Landlord")) landlord = true;
        if (disclosures[i]['category'].includes("Property") &&
        !disclosures[i]['content'].includes("Home -")) landlord = true;
        if (disclosures[i]['category'].includes("Corporate Interests")) investor = true;
        if (disclosures[i]['category'].includes("Investments, Mutual Funds, Bonds & Other Securities")) investor = true;
        if (disclosures[i]['category'].includes("Trusts Held")) investor = true;
    }

    res.render('member', {
        title: 'Member Details',
        siteTitle: req.i18n.t("ns.title"),
        portraitPath: "ns_mla_images",
        ...mla,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: englishHomeTextGenerator(mla['name'], "Homeowner", homeowner),
        landlord: englishHomeTextGenerator(mla['name'], "Landlord", landlord),
        investor: englishInvestorTextGenerator(mla['name'], investor),
    });
});

/* PRINCE EDWARD ISLAND */
app.get('/:lang/pe/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/pe/${constituency_slug}`);

    let mla = await PEI_MLAS.findOne({ constituency_slug }, COLLATION);
    let disclosures = await PEI_DISCLOSURES.find({ name: mla.name }, COLLATION).sort({ category: 1 }).toArray();

    let homeowner = true; // Research suggests this to be true, and they are not required to disclose personal property. Can pivot with better data later.
    let landlord = false;
    let investor = false;
    for (let i=0; i<disclosures.length;++i) {
        if (disclosures[i]['category'] == 'Assets' && disclosures[i]['content'].includes('PID')) {
            landlord = true;
        }
        if (disclosures[i]['category'] == 'Offices & Directorships') {
            investor = true;
        }
        if (disclosures[i]['category'] == 'Assets' && !disclosures[i]['content'].includes('PID')) {
            investor = true;
        }
    }

    res.render('member', {
        title: 'Member Details',
        siteTitle: req.i18n.t("pe.title"),
        portraitPath: "pe_mla_images",
        ...mla,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: englishHomeTextGenerator(mla['name'], "Homeowner", homeowner),
        landlord: englishHomeTextGenerator(mla['name'], "Landlord", landlord),
        investor: englishInvestorTextGenerator(mla['name'], investor),
    });
});

app.get('/:lang/nb/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/nb/${constituency_slug}`);

    let mla = await NEW_BRUNSWICK_MLAS.findOne({ constituency_slug }, COLLATION);
    let disclosures = await NEW_BRUNSWICK_DISCLOSURES.find({ name: mla.name }, COLLATION).sort({ category: 1 }).toArray();

    let homeowner = false;
    let landlord = false;
    let investor = false;

    res.render('member', {
        title: 'Member Details',
        siteTitle: req.i18n.t("nb.title"),
        portraitPath: "nb_mla_images",
        ...mla,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: "No data is available on Home Ownership. See the notice on the main page.",
        landlord: "No data is available on Property Ownership. See the notice on the main page.",
        investor: "No data is available on Assets & Investments. See the notice on the main page.",
    });
});

app.get('/:lang/sk/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/sk/${constituency_slug}`);

    let mla = await SASKATCHEWAN_MLAS.findOne({ constituency_slug }, COLLATION);
    let disclosures = await SASKATCHEWAN_DISCLOSURES.find({ name: mla.name }, COLLATION).sort({ category: 1 }).toArray();

    let homeowner = false;
    let landlord = false;
    let investor = false;

    res.render('member', {
        title: 'Member Details',
        siteTitle: req.i18n.t("sk.title"),
        portraitPath: "sk_mla_images",
        ...mla,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: "No data is available on Home Ownership. See the notice on the main page.",
        landlord: "No data is available on Property Ownership. See the notice on the main page.",
        investor: "No data is available on Assets & Investments. See the notice on the main page.",
    });
});

app.get('/:lang/bc/:constituency', async (req, res) => {
    const { lang, constituency: constituency_slug } = req.params;

    if (lang === "fr") return res.redirect(307, `/en/sk/${constituency_slug}`);

    let mla = await BRITISH_COLUMBIA_MLAS.findOne({ constituency_slug }, COLLATION);
    let disclosures = await BRITISH_COLUMBIA_DISCLOSURES.find({ name: mla.name }, COLLATION).sort({ category: 1 }).toArray();

    let homeowner = false;
    let landlord = false;
    let investor = false;

    res.render('member', {
        title: 'Member Details',
        siteTitle: req.i18n.t("bc.title"),
        portraitPath: "bc_mla_images",
        ...mla,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: "No data is available on Home Ownership. See the notice on the main page.",
        landlord: "No data is available on Property Ownership. See the notice on the main page.",
        investor: "No data is available on Assets & Investments. See the notice on the main page.",
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/* TODO: maybe use `Object.groupBy()`? Not quite the same. */
function groupDisclosures(disclosures) {
    return disclosures.reduce((acc, disclosure) => {
        const { category, content } = disclosure;
        if (!acc[category]) {
        acc[category] = [];
        }
        acc[category].push(content);
        return acc;
    }, {});
}



// These are used for the Ontario MPP details pages.
// TODO: find a better home for this.

function homeOwnerText(name, disclosures) {
    for (let i = 0; i < disclosures.length; ++i) {
        if (disclosures[i].category == 'Liabilities') {
            if (disclosures[i].content.includes('Mortgage')) {
                return `${name} is a Home Owner.`;
            }
        }
    }
    return `${name} is not known to be a Home Owner.`;
}

function landlordText(name, disclosures) {
    for (let i = 0; i < disclosures.length; ++i) {
        if (disclosures[i].category == 'Income') {
            if (disclosures[i].content.includes('Rental')) {
                return `${name} is a Landlord.`;
            }
        }
    }
    return `${name} is not known to be a Landlord.`;
}

function investorText(name, disclosures) {
    for (let i = 0; i < disclosures.length; ++i) {
        if (disclosures[i].category == 'Assets') {
            if (disclosures[i].content.includes('securities')) {
                return `${name} holds significant investments.`;
            }
            if (disclosures[i].content.includes('Shares')) {
                return `${name} holds significant investments.`;
            }
            if (disclosures[i].content.includes('Investment and registered accounts')) {
                return `${name} holds significant investments.`;
            }
        }
        if (disclosures[i].category == 'Income') {
            if (disclosures[i].content.includes('Investment')) {
                return `${name} holds significant investments.`;
            }
        }
    }
    return `${name} is not known to hold significant investments.`;
}

function englishHomeTextGenerator(name, title, status) {
    if (status) {
        return `${name} is a ${title}.`
    } else {
        return `${name} is not known to be a ${title}.`
    }
}

function englishInvestorTextGenerator(name, status) {
    if (status) {
        return `${name} holds significant investments.`
    } else {
        return `${name} is not known to hold significant investments.`
    }
}

function quebecHomeOwnerGenerator(name, status) {
    if (status) {
        return `${name} est propriétaire d'un logement.`
    } else {
        return `${name} n'est pas connu pour être propriétaire d'une logement.`
    }
}

function quebecLandlordGenerator(name, status) {
    if (status) {
        return `${name} reçoit un revenu de location.`
    } else {
        return `${name} ne reçoit pas de revenu de location.`
    }
}

function quebecInvestorGenerator(name, status) {
    if (status) {
        return `${name} possède des actifs ou des investissements importants.`
    } else {
        return `${name} n'est pas connu pour avoir des actifs ou des investissements importants.`
    }
}
