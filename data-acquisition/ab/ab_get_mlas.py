from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
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

mlas = mydb["ab_mlas"]

# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            
# Navigate to the webpage
url = "https://www.assembly.ab.ca/members/members-of-the-legislative-assembly"
driver.get(url)
driver.fullscreen_window()

# Wait for JavaScript to load (adjust timing as needed)
driver.implicitly_wait(8)
sleep(1)

search_box = driver.find_element(By.NAME, 'dtMemberIndex_length')
select_dropdown = Select(search_box)
select_dropdown.select_by_value("100")
sleep(1)

results = driver.find_elements(By.ID, 'hrefDisplayName')

mla_rows = driver.find_elements(By.CSS_SELECTOR, "tr[role='row']")

for row in mla_rows[1:]:
    cells = row.find_elements(By.TAG_NAME, "td")
    img = cells[0].find_element(By.TAG_NAME, "img")
    img_url = img.get_attribute('src')
    img_name = img_url.split('/')[-1].split('"')[0]
    # urlretrieve(img_url, img_name)
    unfixed_name = cells[1].text
    name = unfixed_name.replace("ECA, ", "").replace("KC, ", "").split(', ')[1].replace('Ms. ', "").replace('Ms ', "").replace("Mr. ", "").replace("The Honourable ", "").replace("Honourable ", "").replace("Dr. ", "").replace("Member ", "").replace("Premier ", "").replace("Mrs. ", "") + ' ' + unfixed_name.split(",")[0]
    party = cells[2].text
    constituency = cells[3].text
    doc = {
        'name': name,
        'party': party,
        'constituency': constituency,
        'image_name': img_name,
    }
    print(doc)