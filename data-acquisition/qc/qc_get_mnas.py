from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from slugify import slugify
from urllib.request import urlretrieve
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

mnas = mydb["qc_mnas"]

# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            
# Navigate to the webpage
url = "https://m.assnat.qc.ca/fr/deputes/index.html"
driver.get(url)
driver.fullscreen_window()

# Wait for JavaScript to load (adjust timing as needed)
driver.implicitly_wait(8)
sleep(1)

notice_button = driver.find_element(By.ID, 'didomi-notice-agree-button')
notice_button.click()
sleep(1)

mna_rows = driver.find_elements(By.CLASS_NAME, "depute")

for row in mna_rows:
    # Name
    unfixed_name = row.find_element(By.CLASS_NAME, "nomDepute").text
    name = unfixed_name.split(", ")[1] + " " + unfixed_name.split(", ")[0] 

    # Party
    party = row.find_element(By.CLASS_NAME, "partiDepute").text

    # Constituency
    constituency = row.find_element(By.CLASS_NAME, "circonscriptionDepute").text

    img = row.find_element(By.TAG_NAME, "img")
    img_url = img.get_attribute('src')
    img_name = slugify(name+'-'+constituency)+".jpg"
    # urlretrieve(img_url, img_name)

    doc = {
        'name': name,
        'party': party,
        'constituency': constituency,
        'image_name': img_name,
    }
    print(doc)