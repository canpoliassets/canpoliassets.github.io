from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from bs4 import BeautifulSoup
from time import sleep
# import pymongo
# import sys
# sys.stdout.reconfigure(encoding='utf-8')

# env = open('.env')
# mongo_uri=''
# for line in env:
#     if line.startswith('MONGO_URI'):
#         mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

# myclient = pymongo.MongoClient(mongo_uri)
# mydb = myclient["public_gov"]

# mpps = mydb["mpps"]

# allMpps = mpps.find({}).sort({ 'name': 1})


# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))

f = open('ontario_proper_names.txt', 'r') # We can use the data from ontario_mpp_scraper.py for this
lines = f.readlines()

for mpp in lines:
    mpp = {
        'name': mpp.rstrip('\n')
    }
    try:
        name = mpp['name']
        if (name == 'Jennie Stevens'):
            name = "Jennifer Stevens"
            
        # Navigate to the webpage
        url = "https://pds.oico.on.ca/Pages/Public/PublicDisclosures.aspx"
        driver.get(url)
        
        # Wait for JavaScript to load (adjust timing as needed)
        driver.implicitly_wait(8)

        search_box = driver.find_element(By.ID, 'BodyContent_ddlYear')
        select_dropdown = Select(search_box)
        select_dropdown.select_by_value("2024 (including byelections)")

        name_box = driver.find_element(By.ID, 'BodyContent_ddlMemberName')
        select_dropdown = Select(name_box)
        
        if ('Sarrazin' in name):
            select_dropdown.select_by_value('46cc5c69-f7a1-ef11-8a69-002248b33aec')
        elif ('France G' in name):
            select_dropdown.select_by_value('20cfd858-4d86-ef11-ac21-000d3af33ddc')
        else:
            select_dropdown.select_by_visible_text(name)

        income = driver.find_element(By.ID, "BodyContent_fldMppIncome").text
        assets = driver.find_element(By.ID, "BodyContent_fldMppAssets").text
        liabilities = driver.find_element(By.ID, "BodyContent_fldMppLiabilities").text
        gifts = driver.find_element(By.ID, "BodyContent_fldGiftsAndBenefits").text
        offices = driver.find_element(By.ID, "BodyContent_fldOffices").text

        # # Find and click the search button
        # search_button = driver.find_element(By.ID, 'ctl00_ctl42_g_17022c15_88ec_424e_bf2f_b9bdf7bf3836_csr_SearchLink')
        # search_button.click()

        incomeObj = {
            'name': name,
            'category': 'Income',
            'content': income,
        }
        assetsObj = {
            'name': name,
            'category': 'Assets',
            'content': assets,
        }
        liabilityObj = {
            'name': name,
            'category': 'Liabilities',
            'content': liabilities,
        }
        giftsAndBenefitsObj = {
            'name': name,
            'category': 'Gifts and Benefits',
            'content': gifts,
        }
        officesObj = {
            'name': name,
            'category': 'Offices',
            'content': offices,
        }

        print(incomeObj)
        print(assetsObj)
        print(liabilityObj)
        print(giftsAndBenefitsObj)
        print(officesObj)

        # results = driver.find_elements(By.ID, 'hrefDisplayName')
        # driver.get(results[0].get_attribute("href"))

        # titles = driver.find_elements(By.CLASS_NAME, 'ciec-profilepage-subHeader')
        # items = driver.find_elements(By.CSS_SELECTOR, 'li.ciec-profilepage-declaration')

        # # print(mp['name'])
        # mod = 0
        # for i in range(0, len(titles)):
        #     if len(titles[i].text) > 0:
        #         doc = {
        #             'name': mpp['name'],
        #             'category': titles[i].text,
        #             'content': items[i-mod].text,
        #         }
        #         print(doc)
        #     else:
        #         mod += 1

    except Exception as e:
        print(f"Error ${mpp['name']}: {str(e)}")
