import pymongo
import html

env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]
mps = mydb["mps"]

base_url = 'https://www.ourcommons.ca/'
f = open('parliament.html') # Save a copy to your local and run it against that.

name = ""
party = ""
constituency = ""
province = ""
image_name = ""

for line in f.readlines():
    if '<img' in line:
        image_name = line.split('/')[-1].split('"')[0]
        image_name = html.unescape(image_name)
    if '<div class="ce-mip-mp-name">' in line:
        name = line.split('>')[1].split('<')[0]
        name = html.unescape(name)
    if '<div class="ce-mip-mp-party"' in line:
        party = line.split('>')[1].split('<')[0]
        party = html.unescape(party)
    if '<div class="ce-mip-mp-constituency">' in line:
        constituency = line.split('>')[1].split('<')[0]
        constituency = html.unescape(constituency)
    if '<div class="ce-mip-mp-province">' in line:
        province = line.split('>')[1].split('<')[0]
        province = html.unescape(province)

        mp_object = {
            'name': name,
            'party': party,
            'constituency': constituency,
            'province': province,
            'image_name': image_name,
        }
        # print(mp_object)
        mps.insert_one(mp_object)

    