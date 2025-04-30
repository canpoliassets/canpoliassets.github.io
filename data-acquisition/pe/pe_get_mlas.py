from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from urllib.request import urlretrieve
from time import sleep
import sys
import pymongo
from slugify import slugify
sys.stdout.reconfigure(encoding='utf-8')

env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

mlas = mydb["pe_mlas"]
# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            
# Navigate to the webpage
url = "https://www.assembly.pe.ca/members"
driver.get(url)

# Wait for JavaScript to load (adjust timing as needed)
driver.implicitly_wait(4)
sleep(1)

mla_blocks = driver.find_elements(By.CLASS_NAME, "views-row")

for block in mla_blocks:
    img = block.find_element(By.TAG_NAME, "img")
    name_element = block.find_element(By.CLASS_NAME, "member-title")
    party_element = block.find_element(By.CLASS_NAME, "views-field-field-member-pol-affiliation")
    constituency_element = block.find_element(By.CLASS_NAME, "views-field-field-member-constituency")

    name = name_element.text.replace("Hon. ", "")
    name = name.replace("(Cheverie) ", "")
    name = name.rstrip(" ")
    name = name.rstrip("\n")

    party = party_element.text

    constituency = constituency_element.text

    img_url = img.get_attribute('src')
    img_name = slugify(name) +'.png'
    urlretrieve(img_url, img_name)

    doc = {
        'name': name,
        'party': party,
        'constituency': constituency,
        'image_name': img_name,
    }
    print(doc)
    if name == 'Nolan Young':
        break