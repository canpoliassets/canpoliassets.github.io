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


/* React API data — will be removed enventually */

app.get('/api/mps-data', async (_req, res) => {
    try {
        let allMPS = await MPS.find({ }).sort({ name: 1 }).toArray();
        res.json({ mps: allMPS});
    } catch (error) {
        res.status(500).json({ error: 'Error fetching items' });
    }
});

app.get('/api/mpps-data', async (_req, res) => {
    try {
        let allMPPS = await ONTARIO_MPPS.find({ }).sort({ name: 1 }).toArray();
        res.json({ mpps: allMPPS });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching items' });
    }
});

app.get('/api/mlas-data', async (_req, res) => {
    try {
        let allMLAS = await ALBERTA_MLAS.find({ }).sort({ name: 1 }).toArray();
        res.json({ mlas: allMLAS });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching items' });
    }
});

app.get('/api/mnas-data', async (_req, res) => {
    try {
        let allMNAS = await QUEBEC_MNAS.find({ }).sort({ name: 1 }).toArray();
        res.json({ mnas: allMNAS });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching items' });
    }
});

// These localized routes need to come after the non-localized ones or static files for now…

app.use("/:lang", (req, res, next) => {
    const { lang } = req.params;
    if (lang !== "en" && lang !== "fr") res.status(404).send("Page not found");

    req.i18n.locale(lang);
    res.locals.lang = lang;

    next();
});

/* ABOUT */

app.get('/:lang/about', (req, res) => {
    const { lang } = req.params
    if (lang === 'fr') res.redirect(307, '/en/about');
    res.render('about', { title: 'About Us' });
});

/* FEDERAL */

app.get('/:lang', async (req, res) => {
    const { lang } = req.params;

    if (lang === "fr") res.redirect(307, "/en");

    let mps = await MPS.aggregate([
        {
            $lookup: {
                from: "sheet_data",
                localField: "name",
                foreignField: "name",
                as: "sheet_data_matches"
            },
        },
        {
            $replaceRoot: {
                newRoot: {
                    $mergeObjects: [ { $arrayElemAt: [ "$sheet_data_matches", 0 ] }, "$$ROOT" ],
                },
            },
        },
        {
            $project: { sheet_data_matches: 0 },
        },
    ]).sort({ name: 1 }).toArray();

    const parties = new Map();
    let totalMps = 0;
    let totalLandlords = 0;

    for (const mp of mps) {
        mp.landlord = mp.landlord === "Y";
        mp.homeowner = mp.home_owner === "Y";
        delete mp.home_owner;
        mp.investor = mp.investor === "Y";

        if (mp.party != null) {
            const party = parties.get(mp.party) ?? parties.set(mp.party, { mps: 0, landlords: 0 }).get(mp.party);

            party.mps++;
            totalMps++;

            if (mp.landlord) {
                party.landlords++;
                totalLandlords++;
            }
        }
    }

    res.render('index', { mps, parties, totalMps, totalLandlords });
});

app.get('/:lang/federal/:constituency', async (req, res) => {
    const { constituency, lang } = req.params;

    if (lang === "fr") res.redirect(307, `/fr/federal/${name}`)

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

/* ONTARIO */

app.get('/:lang/on', (req, res) => {
    const { lang } = req.params
    if (lang === 'fr') res.redirect(307, '/en/on');
    res.render('ontario-index', { title: req.i18n.t("on.title") });
});

app.get('/:lang/on/:name', async (req, res) => {
    const { name, lang } = req.params;

    if (lang === "fr") res.redirect(307, `/en/on/${name}`);

    let name_split = name.split("_");
    let final_name_sanitized = name_split.join(" ").replace(/[^a-zA-Z0-9\u00E0-\u00FC\u00E8-\u00EB\u0152\u0153\u00C0-\u00FC\u00C8-\u00CB\u0152. '-]/g, '');

    let mpp = await ONTARIO_MPPS.findOne({ name: final_name_sanitized }, COLLATION);
    let disclosures = await ONTARIO_DISCLOSURES.find({ name: final_name_sanitized }, COLLATION).sort({ category: 1 }).toArray();

    res.render('ontario-mpp', {
        title: 'Member Details',
        ...mpp,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: homeOwnerText(mpp.name, disclosures),
        landlord: landlordText(mpp.name, disclosures),
        investor: investorText(mpp.name, disclosures),
    });
});

/* ALBERTA */

app.get('/:lang/ab', (req, res) => {
    const { lang } = req.params
    if (lang === 'fr') res.redirect(307, '/en/ab');
    res.render('alberta-index', { title: req.i18n.t("ab.title") });
});

app.get('/:lang/ab/:name', async (req, res) => {
    const { name, lang } = req.params;

    if (lang === "fr") res.redirect(307, `/en/ab/${name}`);

    let name_split = name.split("_");
    let final_name_sanitized = name_split.join(" ").replace(/[^a-zA-Z0-9\u00E0-\u00FC\u00E8-\u00EB\u0152\u0153\u00C0-\u00FC\u00C8-\u00CB\u0152. '-]/g, '');

    let mla = await ALBERTA_MLAS.findOne({ name: final_name_sanitized }, COLLATION);
    let disclosures = await ALBERTA_DISCLOSURES.find({ name: final_name_sanitized }, COLLATION).sort({ category: 1 }).toArray();

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

    res.render('alberta-mla', {
        title: 'Member Details',
        ...mla,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: albertaTextGenerator(mla['name'], "Homeowner", homeowner),
        landlord: albertaTextGenerator(mla['name'], "Landlord", landlord),
        investor: albertaInvestorTextGenerator(mla['name'], investor),
    });
});

/* QUEBEC */

app.get('/:lang/qc', (req, res) => {
    const { lang } = req.params
    if (lang === 'en') res.redirect(307, '/fr/qc');
    res.render('quebec-index', { title: req.i18n.t("qc.title") });
});

app.get('/:lang/qc/:name', async (req, res) => {
    const { name, lang } = req.params;

    if (lang === "en") res.redirect(307, `/fr/qc/${name}`);

    let name_split = name.split("_");
    let final_name_sanitized = name_split.join(" ").replace(/[^a-zA-Z0-9\u00E0-\u00FC\u00E8-\u00EB\u0152\u0153\u00C0-\u00FC\u00C8-\u00CB\u0152. '-]/g, '');

    let mna = await QUEBEC_MNAS.findOne({ name: final_name_sanitized }, COLLATION);
    let disclosures = await QUEBEC_DISCLOSURES.find({ name: final_name_sanitized }, COLLATION).sort({ category: 1 }).toArray();

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

    res.render('quebec-mna', {
        title: 'Détails du Membre',
        ...mna,
        groupedDisclosures: groupDisclosures(disclosures),
        homeowner: quebecHomeOwnerGenerator(mna['name'], homeowner),
        landlord: quebecLandlordGenerator(mna['name'], landlord),
        investor: quebecInvestorGenerator(mna['name'], investor),
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

function albertaTextGenerator(name, title, status) {
    if (status) {
        return `${name} is a ${title}.`
    } else {
        return `${name} is not known to be a ${title}.`
    }
}

function albertaInvestorTextGenerator(name, status) {
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
