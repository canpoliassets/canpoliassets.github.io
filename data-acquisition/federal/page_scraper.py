from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
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
for mp in allMps:
    try:
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
        
        # name += " Member of Parliament" # Helps English results
            
        # Navigate to the webpage
        url = "https://prciec-rpccie.parl.gc.ca/FR/PublicRegistries/Pages/PublicRegistry.aspx"
        driver.get(url)
        
        # Wait for JavaScript to load (adjust timing as needed)
        driver.implicitly_wait(8)

        # search_box = driver.find_element(By.ID, 'ctl00_ctl42_g_17022c15_88ec_424e_bf2f_b9bdf7bf3836_csr_sbox') # ENGLISH
        search_box = driver.find_element(By.ID, 'ctl00_ctl42_g_3078cd07_63c4_4c23_898f_494ecbf4858b_csr_sbox') # FRENCH
        
        search_box.send_keys(name)

        # Find and click the search button
        # search_button = driver.find_element(By.ID, 'ctl00_ctl42_g_17022c15_88ec_424e_bf2f_b9bdf7bf3836_csr_SearchLink') # ENGLISH
        search_button = driver.find_element(By.ID, 'ctl00_ctl42_g_3078cd07_63c4_4c23_898f_494ecbf4858b_csr_SearchLink') # FRENCH
        search_button.click()

        sleep(3.5)

        results = driver.find_elements(By.ID, 'hrefDisplayName')
        driver.get(mp['link'])
        # driver.get(results[0].get_attribute("href"))

        titles = driver.find_elements(By.CLASS_NAME, 'ciec-profilepage-subHeader')
        items = driver.find_elements(By.CSS_SELECTOR, 'li.ciec-profilepage-declaration')

        # print(mp['name'])
        mod = 0
        for i in range(0, len(titles)):
            if len(titles[i].text) > 0:
                doc = {
                    'name': mp['name'],
                    'category_fr': titles[i].text,
                    'content_fr': items[i-mod].text, # Chance key names as needed for EN.
                }
                print(doc)
            else:
                mod += 1
        
        # Get the rendered HTML
        # html_content = driver.page_source

        # print(html_content)

        # soup = BeautifulSoup(html_content, 'html.parser')
        # elements = soup.find_all('div', class_='ciec-declaration-disclosurecontent')

        # # # Get the text content
        # for i in elements:
        #     print(i.text+'\n')
        
        # # Print or process the content
        # print(html_content)

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