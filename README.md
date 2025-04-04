# README & FAQ

This is the source for [ismympalandlord.ca](https://ismympalandlord.ca) inspired originally by Isaac Peltz and initially put together by OmegaSheep and maintained and improved (hopefully) by the community.

## Stack:

- Runtime: Node.js
- Web framework: [Express.js](https://expressjs.com/)
- Templating: [Pug.js](https://pugjs.org/)
- Database: MongoDB - (Cheap, malleable, handles French characters nicely)

## FAQ

### Why is the [thing] so [criticism]?

This was put together in a hurry to quickly prototype and share something publicly. If something is bad, it's likely because it was done quickly. I encourage you to make it better.

### How is this hosted?

fly.io

## Dev Setup

You will need:

- Docker with docker-compose
- NodeJS >= 22

```shell
cp .env.sample .env
docker-compose up -d

npm install
npm start
```

## SCHEMA

`mps` - Members of Parliament (sourced from ourcommons.ca)

```
{
    name: String,
    constituency: String,
    party: String,
    province: String,
    image_name: String
}
```

`disclosures` - What MPs have declared (sourced from the ethics portal)

```
{
    name: String,     # name of mp
    category: String, # eg. Passifs, Cadeaux etc
    content: String,  # full content
}
```

`disclosures_fr` - What MPS have declared, but in french (sourced from ethics portal - 99.999% parity with english data)

```
{
    name: String,     # name of mp
    category: String, # eg. Assets, Sponsored Travel
    content: String,  # full content from ethics portal
}
```

`disclosures_fr` - What MPs have declared, but in french (sourced from the ethics portal)

```
{
    name: String,     # name of mp
    category: String, # eg. Passifs
    content: String, # en francais
}
```

`sheet_data` - This is spreadsheet data gathred by Isaac Peltz. We should merge this with MPS and/or deprecate it - but since the source is distinct it is presently kept separately.

Ideally we should derive this from the ethics portal disclosures directly. . .

```
{
    name: String,      # name of mp
    home_owner: String, # value not always boolean
    landlord: String,  # value not always boolean
    investor: String,  # value not always boolean
}
```

`ontario_mpps` - Members of Provincial Parliament for Ontario

```
{
    name: String,
    constituency: String,
    party: String,
    image_name: String
}
```

`ontario_disclosures` - What MPPs have declared. No official French language translations available.

```
{
    name: String,     # name of mp
    category: String, # eg. Assets, Sponsored Travel
    content: String,  # full content from ethics portal
}
```

`alberta_mlas` - Members of Provincial Parliament for Alberta

```
{
    name: String,
    constituency: String,
    party: String,
    image_name: String
}
```

`alberta_disclosures` - What MLAs have declared. No official French language translations available.

```
{
    name: String,     # name of mp
    category: String, # eg. Assets, Sponsored Travel
    content: String,  # full content from ethics portal
}
```

`quebec_mnas` - Members of National Assembly for Quebec

```
{
    name: String,
    constituency: String,
    party: String, # in french by default
    image_name: String
}
```

`quebec_disclosures` - What MNAs have declared. No official English language translations available.

```
{
    name: String,     # name of mp
    category: String, # eg. Passifs etc
    content: String,  # full content from ethics portal
}
```

`british_columbia_mlas` - Members of Provincial Parliament for British Columbia

```
{
    name: String,
    constituency: String,
    party: String,
    image_name: String
}
```
