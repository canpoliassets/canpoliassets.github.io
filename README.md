# README & FAQ

This is the source for `ismympalandlord.ca` inspired originally by Isaac Peltz and initially put together by OmegaSheep and maintained and improved (hopefully) by the community.

## Stack:

- Node.js / Express
- MongoDB - (Cheap, malleable, handles french characters nicely)
- React (done poorly)

# FAQ

## Why is the frontend/backend/design so bad/poor/messy?

This was put together in a hurry to quickly prototype and share something publicly. If something is bad, it's likely because it was done quickly. I encourage you to make it better.

## How is this hosted?

fly.io

## Who owns the domain?

OmegaSheep

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

`sheet_data` - This is spreadsheet data gathred by Isaac Peltz. We should merge this with MPS and/or deprecate it - but since the source is distinct it is presently kept separately.

Ideally we should derive this from the ethics portal disclosures directly. . .

```
{
    name: String,      # name of mp
    homeowner: String, # value not always boolean
    landlord: String,  # value not always boolean
    investor: String,  # value not always boolean
}
```
