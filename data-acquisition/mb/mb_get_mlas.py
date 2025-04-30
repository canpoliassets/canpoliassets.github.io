from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from urllib.request import urlretrieve, build_opener, Request
from time import sleep
from bs4 import BeautifulSoup
import sys
import pymongo
import requests
sys.stdout.reconfigure(encoding='utf-8')

def download_image(url, filename):
    try:
        # Send GET request
        response = requests.get(url)
        
        # Check if successful
        if response.status_code == 200:
            # Write image to file
            with open(filename, 'wb') as file:
                file.write(response.content)
            print(f"Successfully downloaded {filename}")
        else:
            print(f"Failed to download image. Status code: {response.status_code}")
            
    except Exception as e:
        print(f"An error occurred: {str(e)}")

env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

mlas = mydb["mb_mlas"]
user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            
# Navigate to the webpage
url = "https://www.gov.mb.ca/legislature/members/mla_list_alphabetical.html"
driver.get(url)
driver.fullscreen_window()

# Wait for JavaScript to load (adjust timing as needed)
driver.implicitly_wait(8)
sleep(1)

mla_rows = driver.find_elements(By.CSS_SELECTOR, "tbody tr")

link_list = []

for row in mla_rows[1:]:
    a_tags = row.find_elements(By.TAG_NAME, "a")
    if (len(a_tags) == 0):
        break

    the_link = a_tags[0].get_attribute('href')
    link_list.append(the_link)

for link in link_list:
    driver.get(link)

    data_div = driver.find_element(By.CSS_SELECTOR, "div[class='members']")

    name_and_constituency = data_div.find_element(By.TAG_NAME, "h2")
    
    inner_html = name_and_constituency.get_attribute("innerHTML")
    soup = BeautifulSoup(inner_html, "html.parser")
    parts = [part.strip() for part in soup.stripped_strings]

    name = parts[0].replace("Hon. ", "") # Some are double spaced because consistency!
    constituency = parts[1]

    name = name.replace("  ", " ")

    # Manual Corrections

    # Her page has random spacing in the div
    if name == 'Billie':
        name = 'Billie Cross'
        constituency = 'Seine River'
    
    # Another weird spacing inconsistency - probably a more robust way to do it, but f it
    if name == "Hon.":
        name = "Renée Cable"
        constituency = "Southdale"

    partyBlock = data_div.find_elements(By.TAG_NAME, "h3")[0]
    partyText = partyBlock.text

    party = "N/A"
    if "Independent Liberal" in partyText:
        party = "IND LIB"
    elif "IND" in partyText:
        party = "IND"
    elif "NDP" in partyText:
        party = "NDP"
    elif "PC" in partyText:
        party = "PC"

    img = driver.find_element(By.CSS_SELECTOR, "img[class='page_graphic']")
    img_url = img.get_attribute('src')
    img_name = img_url.split('/')[-1].split('"')[0]

    # download_image(img_url.replace('https', 'http'), img_name)

    sleep(1)
    
    doc = {
        'name': name,
        'party': party,
        'constituency': constituency,
        'image_name': img_name,
    }
    print(doc)