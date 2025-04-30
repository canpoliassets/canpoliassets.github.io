"""
Deprecated script for inserting Isaac Peltz's sheet data into the DB.

We are moving away from the model of using external data to flag landlordism etc.
"""

import pymongo
from pymongo.collation import Collation, CollationStrength
from collections import defaultdict

env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

mps = mydb["mps"]
sheet_data = mydb["sheet_data"]

f = open('data.txt', 'r')

count = 0
for line in f.readlines():
    if len(line.split('	')) == 6:
        line = line.split('	')
        x = mps.find({
            'name': line[0]
        }).collation(Collation(
            locale='fr_CA',
            strength=CollationStrength.SECONDARY
        ))
        
        document = {
            'name': line[0],
            'home_owner': line[-3],
            'landlord': line[-2],
            'investor': line[-1].rstrip('\n'),
        }
        if (len(list(x)) == 0):
            print(document)
            count += 1
        else:
            document = {
                'name': line[0],
                'home_owner': line[-3],
                'landlord': line[-2],
                'investor': line[-1].rstrip('\n'),
            }
            # sheet_data.insert_one(document)


        # print(line[0], line[-3], line[-2], line[-1].rstrip('\n'))