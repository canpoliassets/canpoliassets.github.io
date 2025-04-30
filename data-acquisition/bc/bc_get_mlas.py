from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from urllib.request import urlretrieve
from slugify import slugify
from time import sleep
import sys
import pymongo
sys.stdout.reconfigure(encoding='utf-8')

env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

mlas = mydb["ab_mlas"]

# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            
# Navigate to the webpage
url = "https://www.leg.bc.ca/members/find-mla-by-constituency"
driver.get(url)
driver.fullscreen_window()

# Wait for JavaScript to load (adjust timing as needed)
driver.implicitly_wait(10)
sleep(1)

driver.switch_to.frame(driver.find_element(By.TAG_NAME, "iframe"))

mla_list = driver.find_element(By.CLASS_NAME, 'mla-by-constituency_mlaByConstituency__8snMU')

sub_divs = mla_list.find_elements(By.TAG_NAME, 'div')

for i in range(0, len(sub_divs)):
    
    # Constituency Block
    if i % 5 == 0:
        constituency = sub_divs[i].text
    
    # Image / Name Block
    elif i % 5 == 1:
        name = sub_divs[i].text
        name = name.replace("Hon. ", "")
        name = name.replace(", K.C.", "")
        if " - " in name:
            name = name.split(" - ")[1] + " (" + name.split(" - ")[0] + ")"

        img = sub_divs[i].find_element(By.TAG_NAME, 'img')
        img_url = img.get_attribute('src')
        img_name = slugify(name)+'.jpg'
        urlretrieve(img_url, img_name)

    # Do nothing Block
    elif i % 5 == 2:
        continue

    # Do nothing Block
    elif i % 5 == 3:
        continue
    
    # Party Block
    elif i % 5 == 4:
        party = sub_divs[i].text
    
        doc = {
            'name': name,
            'party': party,
            'constituency': constituency,
            'image_name': img_name,
        }
        print(doc)