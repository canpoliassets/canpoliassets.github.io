# README & FAQ

This is the source for `ismympalandlord.ca` inspired originally by Isaac Peltz and initially put together by OmegaSheep and maintained and improved (hopefully) by the community.

## Stack:

- Node.js / Express
- MongoDB - (Cheap, malleable, handles french characters nicely)
- React (Needs work)

# FAQ

## Why is the [thing] so [criticism]?

This was put together in a hurry to quickly prototype and share something publicly. If something is bad, it's likely because it was done quickly. I encourage you to make it better.

## How is this hosted?

fly.io

# Dev Setup

You will need:

- Docker with docker-compose
- NodeJS >= 18

```
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