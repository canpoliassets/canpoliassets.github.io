"""
DEPRECATED SCRIPT - This is from back when we tried to have EN/FR data in a single document instead
of two separate data collections.

Use page_scraper.py and just make edits as needed for EN/FR.
"""

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
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

mps = mydb["mps"]

allMps = mps.find({}).sort({ 'name': 1})

# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

# These two had problematic pages...
fakeData = [
    {
        "name": "Chris d'Entremont",
        'link': 'https://prciec-rpccie.parl.gc.ca/FR/PublicRegistries/Pages/Declaration.aspx?DeclarationID=18202e4b-9034-ef11-8174-001dd8b7242d'
    },
    {
        "name": "Ya'ara Saks",
        'link': 'https://prciec-rpccie.parl.gc.ca/FR/PublicRegistries/Pages/Declaration.aspx?DeclarationID=d572dafb-5102-ef11-8186-001dd8b72449'
    }
]
en_url = "https://prciec-rpccie.parl.gc.ca/EN/PublicRegistries/Pages/PublicRegistry.aspx"
fr_url = "https://prciec-rpccie.parl.gc.ca/FR/PublicRegistries/Pages/PublicRegistry.aspx"
for mp in allMps:
    if "Entre" in mp['name'] or "Saks" in mp['name']:
        try:
            doc_array = []
            print(f'--${mp["name"]}')
            name = mp['name']
            if (name == 'Rick Perkins'):
                name = "Richard Perkins"

            if (name == 'Patty Hajdu'):
                name = "Patricia Hajdu"

            if (name == 'Rhéal Éloi Fortin'):
                name = 'Rhéal Fortin'

            if (name == 'Rhéal Éloi Fortin'):
                name = 'Rhéal Fortin'

            if (name == 'Mike Morrice'):
                name = 'Michael Morrice'
            
            if len(name.split(" ")) == 3 and "." in name.split(" ")[1]:
                name = name.split(" ")[0] + " " + name.split(" ")[2]
                
            # Navigate to the webpage
            driver.get(en_url)
            
            # Wait for JavaScript to load (adjust timing as needed)
            driver.implicitly_wait(8)

            en_search_box = driver.find_element(By.ID, 'ctl00_ctl42_g_17022c15_88ec_424e_bf2f_b9bdf7bf3836_csr_sbox') # ENGLISH
            
            en_search_box.send_keys(name + " Member of Parliament")

            # Find and click the search button
            en_search_button = driver.find_element(By.ID, 'ctl00_ctl42_g_17022c15_88ec_424e_bf2f_b9bdf7bf3836_csr_SearchLink') # ENGLISH
            en_search_button.click()

            sleep(3.5)

            results = driver.find_elements(By.ID, 'hrefDisplayName')
            # driver.get(mp['link'])
            driver.get(results[0].get_attribute("href"))

            titles = driver.find_elements(By.CLASS_NAME, 'ciec-profilepage-subHeader')
            items = driver.find_elements(By.CSS_SELECTOR, 'li.ciec-profilepage-declaration')

            # print(mp['name'])
            mod = 0
            for i in range(0, len(titles)):
                if len(titles[i].text) > 0:
                    doc = {
                        'name': mp['name'],
                        'category': titles[i].text,
                        'content': items[i-mod].text,
                    }
                    doc_array.append(doc)
                else:
                    mod += 1

            # Navigate to the webpage
            driver.get(fr_url)
            
            # Wait for JavaScript to load (adjust timing as needed)
            driver.implicitly_wait(8)

            fr_search_box = driver.find_element(By.ID, 'ctl00_ctl42_g_3078cd07_63c4_4c23_898f_494ecbf4858b_csr_sbox') # FRENCH
            
            fr_search_box.send_keys(name + " Député")

            # Find and click the search button
            fr_search_button = driver.find_element(By.ID, 'ctl00_ctl42_g_3078cd07_63c4_4c23_898f_494ecbf4858b_csr_SearchLink') # FRENCH
            fr_search_button.click()

            sleep(3.5)

            results = driver.find_elements(By.ID, 'hrefDisplayName')
            driver.get(mp['link'])
            
            if (mp['name'] == fakeData[0]['name']):
                driver.get(fakeData[0]['link'])
            elif (mp['name'] == fakeData[1]['name']):
                driver.get(fakeData[1]['link'])
            else: 
                driver.get(results[0].get_attribute("href"))

            titles = driver.find_elements(By.CLASS_NAME, 'ciec-profilepage-subHeader')
            items = driver.find_elements(By.CSS_SELECTOR, 'li.ciec-profilepage-declaration')

            # print(mp['name'])
            mod = 0
            doc_index = 0
            for i in range(0, len(titles)):
                if len(titles[i].text) > 0:
                    doc_array[doc_index]["category_fr"] = titles[i].text
                    doc_array[doc_index]["content_fr"] = items[i-mod].text
                    doc_index += 1
                else:
                    mod += 1
            
            for i in doc_array:
                print(i)

        except Exception as e:
            print(f"Error ${mp['name']}: {str(e)}")

        # finally:
        #     # Clean up
        #     driver.quit()
        #     sys.exit(1)


        # OPEN PORTAL SEARCH
        # TYPE IN NAME HIT SEARCH
        # CLICK FIRST DOCUMENT
        # COMMIT DOCUMENT(S) TO DB