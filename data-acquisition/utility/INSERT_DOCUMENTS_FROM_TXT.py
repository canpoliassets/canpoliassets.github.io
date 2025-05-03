"""We don't insert data directly into the DB from the scripts because it often needs intense validation and human reading to be sure it's good.

This file can be used to insert data from a reviewed text document into the database."""

import pymongo
import ast
import sys
sys.stdout.reconfigure(encoding='utf-16')

env = open('../../.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

# Table you plan to insert into.
ACTIVE_TABLE = mydb["manitoba_disclosures"]

# Text file with your JSON blobs. Chance encoding as needed.
f = open('final.txt', 'r', encoding='utf-8', errors='replace')

names = []
for line in f.readlines():
    if "--$" not in line: # sometimes used as a separator for debugging and readability
        line = line.rstrip('\n')
        document_dict = ast.literal_eval(line)
        data = ACTIVE_TABLE.insert_one(document_dict)
