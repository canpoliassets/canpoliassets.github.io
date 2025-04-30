"""We don't create slugs in the individual data scripts, especially older ones - so this can be used to add them later."""

import pymongo
from slugify import slugify
import sys
sys.stdout.reconfigure(encoding='utf-8')

env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

reps = mydb["pei_mlas"] # Chance to relevant table.

all_reps = reps.find({})

for mla in all_reps:
    reps.find_one_and_update({ 'name': mla['name'] }, { '$set': { 'constituency_slug': slugify(mla['constituency']) }})
