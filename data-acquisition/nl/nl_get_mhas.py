from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from urllib.request import urlretrieve, build_opener, Request
from time import sleep
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

mhas = mydb["nl_mhas"]
user_agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            
# Navigate to the webpage
url = "https://www.assembly.nl.ca/Members/members.aspx"
driver.get(url)
driver.fullscreen_window()

# Wait for JavaScript to load (adjust timing as needed)
driver.implicitly_wait(8)
sleep(1)

mha_rows = driver.find_elements(By.CSS_SELECTOR, "tbody tr")

link_list = []

for row in mha_rows:
    a_tags = row.find_elements(By.TAG_NAME, "a")

    the_link = a_tags[0].get_attribute('href')
    link_list.append(the_link)

for link in link_list:
    driver.get(link)

    name = driver.find_element(By.CSS_SELECTOR, "h1[class='memberBio']")
    name = name.text

    constituency = driver.find_element(By.CSS_SELECTOR, "h2[class='memberBio']")
    constituency = constituency.text

    party = driver.find_element(By.CSS_SELECTOR, "h3[class='memberBio']")
    party = party.text

    img = driver.find_elements(By.CSS_SELECTOR, "img[class='img-responsive']")[1]
    img_url = img.get_attribute('src')
    img_name = img_url.split('/')[-1].split('"')[0]

    # download_image(img_url.replace('https', 'http'), img_name) # This throws a server-side 500 - needs a fix.

    sleep(1)
    
    doc = {
        'name': name,
        'party': party,
        'constituency': constituency,
        'image_name': img_name,
    }
    print(doc)







    # img = cells[0].find_element(By.TAG_NAME, "img")
    # img_url = img.get_attribute('src')
    # img_name = img_url.split('/')[-1].split('"')[0]
    # # urlretrieve(img_url, img_name)
    # unfixed_name = cells[1].text
    # name = unfixed_name.replace("ECA, ", "").replace("KC, ", "").split(', ')[1].replace('Ms. ', "").replace('Ms ', "").replace("Mr. ", "").replace("The Honourable ", "").replace("Honourable ", "").replace("Dr. ", "").replace("Member ", "").replace("Premier ", "").replace("Mrs. ", "") + ' ' + unfixed_name.split(",")[0]
    # party = cells[2].text
    # constituency = cells[3].text