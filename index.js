require('dotenv').config(); //initialize dotenv

const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

const dbClient = new MongoClient(uri);
const database = dbClient.db("public_gov");

const MPS = database.collection('mps'); // MP Data sourced from ourcommons.ca 
const SHEET_DATA = database.collection('sheet_data'); // Isaac's Sheet Data
const DISCLOSURES = database.collection('disclosures'); // Disclosures sourced from the ethics portal directly

const ONTARIO_MPPS = database.collection('ontario_mpps');
const ONTARIO_DISCLOSURES = database.collection('ontario_disclosures');

const COLLATION = { collation : {locale: "fr_CA", strength: 2 }}

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');
const pug = require('pug');

app.set('view engine', 'pug');

app.locals.siteTitle = 'Is My MP a Landlord?';
app.locals.ontarioSiteTitle = 'Is My MPP a Landlord?';
app.locals.contactEmail = 'mplandlordcheck [ at ] protonmail [ dot ] com';
app.locals.prciec = {
    href: 'https://prciec-rpccie.parl.gc.ca/EN/PublicRegistries/Pages/PublicRegistry.aspx',
    label: 'Office of Conflict of Interest and Ethics Commissioner',
};
app.locals.pds = {
    href: 'https://pds.oico.on.ca/Pages/Public/PublicDisclosures.aspx',
    label: 'Office of the Integrity Commissioner',
};

app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    // Set the locale here
    res.locals.lang = 'en';
    next();
});

app.get('/', async (_req, res) => {
    let mps = await MPS.find({ }).sort({ name: 1 }).toArray();

    res.render('index', { mps });
});

app.get('/ontario', (_req, res) => {
    res.render('ontario-index');
});


app.get('/about', (_req, res) => {
    res.render('about', { title: 'About Us' });
});

app.get('/mp/:name', async (req, res) => {
    const { name } = req.params;

    name_split = name.split("_");
    province = name_split.pop(0);
    final_name_sanitized = name_split.join(" ").replace(/[^a-zA-Z0-9\u00E0-\u00FC\u00E8-\u00EB\u0152\u0153\u00C0-\u00FC\u00C8-\u00CB\u0152. '-]/g, '');

    let mp = await MPS.findOne({ name: final_name_sanitized, province: province }, COLLATION);
    let { homeowner, landlord, investor } = await SHEET_DATA.findOne({ name: final_name_sanitized }, COLLATION);
    let disclosures = await DISCLOSURES.find({ name: final_name_sanitized }, COLLATION).sort({ category: 1 }).toArray();

    res.render('mp', {
        title: `${mp.name} | Member Details`,
        ...mp,
        homeowner,
        landlord,
        investor,
        groupedDisclosures: groupDisclosures(disclosures),
    });
});

app.get('/mpp/:name', async (req, res) => {
    const { name } = req.params;

    name_split = name.split("_");
    final_name_sanitized = name_split.join(" ").replace(/[^a-zA-Z0-9\u00E0-\u00FC\u00E8-\u00EB\u0152\u0153\u00C0-\u00FC\u00C8-\u00CB\u0152. '-]/g, '');

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

app.use(express.static(path.join(__dirname, 'public')));

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

app.get('/robots.txt', function (_req, res) {
    res.type('text/plain');
    // res.send("User-agent: *\nDisallow: /");
    res.send("User-agent: *Allow: /")
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));



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

