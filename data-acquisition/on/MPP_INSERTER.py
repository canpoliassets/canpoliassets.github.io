import pymongo
import ast

env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

mpps = mydb["ontario_mpps"]
disc = mydb["ontario_disclosures"]

f = open('MPP_DATA_FINAL.txt', 'r', encoding='utf-8')

f2 = open('MPP_DISCLOSURES_FINAL.txt', 'r', encoding='utf-8')

# names = []
# for line in f.readlines():
#     line = line.rstrip('\n')
#     person_dict = ast.literal_eval(line)
#     names.append(person_dict['name'])


# for line in f2.readlines():
#     line = line.rstrip('\n')
#     disc_dict = ast.literal_eval(line)
#     if (disc_dict['name'] not in names):
#         print(disc_dict['name'], 'not in names')

for line in f.readlines():
    line = line.rstrip('\n')
    person_dict = ast.literal_eval(line)
    person_dict['image_name'] += '.jpg'
    allMpps = mpps.insert_one(person_dict)

for line in f2.readlines():
    line = line.rstrip('\n')
    disc_dict = ast.literal_eval(line)
    allMpps = disc.insert_one(disc_dict)