import pymongo
import ast
import sys
sys.stdout.reconfigure(encoding='utf-8')

env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

ACTIVE_TABLE = mydb["newfoundland_disclosures"]

f = open('nl_disclosures.txt', 'r', encoding='utf-8')

names = []
for line in f.readlines():
    line = line.rstrip('\n')
    split = line.split(' $ ')
    document_dict = {
        'name': split[0],
        'category': split[1],
        'content': split[2],
    }
    data = ACTIVE_TABLE.insert_one(document_dict)

# for line in f.readlines():
#     line = line.rstrip('\n')
#     person_dict = ast.literal_eval(line)
#     person_dict['image_name'] += '.jpg'
#     allMpps = mpps.insert_one(person_dict)
