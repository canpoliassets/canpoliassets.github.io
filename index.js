require('dotenv').config(); //initialize dotenv

const { MongoClient } = require("mongodb");
const uri = process.env.MONGO_URI;

const dbClient = new MongoClient(uri);
const database = dbClient.db("public_gov");

const MPS = database.collection('mps'); // MP Data sourced from ourcommons.ca 
const SHEET_DATA = database.collection('sheet_data'); // Isaac's Sheet Data
const DISCLOSURES = database.collection('disclosures'); // Disclosures sourced from the ethics portal directly

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public'), {
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'text/javascript');
      }
    }
  }));

app.get('/api/mps-data', async (_req, res) => {
    try {
        let allMPS = await MPS.find({ }).sort({ name: 1 }).toArray();
        res.json({ mps: allMPS});
    } catch (error) {
        res.status(500).json({ error: 'Error fetching items' });
    }
});

app.get('/api/mp-data', async (req, res) => {
    try {
        let name = req.query.name;
        name_split = name.split("_");
        province = name_split.pop(0);
        final_name_sanitized = name_split.join(" ").replace(/[^a-zA-Z0-9\u00E0-\u00FC\u00E8-\u00EB\u0152\u0153\u00C0-\u00FC\u00C8-\u00CB\u0152. '-]/g, '');

        let specificMp = await MPS.find({ name: final_name_sanitized, province: province }, { collation : {locale: "fr_CA", strength: 2 }}).sort({ name: 1 }).toArray();
        let mpSheetData = await SHEET_DATA.findOne({ name: final_name_sanitized }, { collation : {locale: "fr_CA", strength: 2 }});
        let disclosures = await DISCLOSURES.find({ name: final_name_sanitized }, { collation : {locale: "fr_CA", strength: 2 }}).sort({ category: 1 }).toArray();
        res.json({ mp: specificMp, sheet_data: mpSheetData, disclosures: disclosures });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching items' });
    }
});

app.get('/mp/:name', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages/mp-page.html'));
});

app.get('/about', (_req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages/about.html'));
});

app.get('/robots.txt', function (_req, res) {
    res.type('text/plain');
    // res.send("User-agent: *\nDisallow: /");
    res.send("User-agent: *Allow: /")
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on port ${PORT}`));