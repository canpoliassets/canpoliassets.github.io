from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import Select
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from urllib.request import urlretrieve
from bs4 import BeautifulSoup
from time import sleep
# import pymongo
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
hrefs = []
try:
    # Navigate to the webpage
    url = "https://www.ola.org/en/members/parliament-43"
    driver.get(url)
    sleep(1)
    
    # Wait for JavaScript to load (adjust timing as needed)
    driver.implicitly_wait(8)

    links = driver.find_elements(By.TAG_NAME, "a")
    for link in links:
        href = link.get_attribute('href')
        if href and 'en/members/all/' in href:
            hrefs.append(href)

    # Extract and print href attributes
    for href in hrefs:
        if href is None:
            continue
        if ('en/members/all/' in href):
            driver.get(href)
            sleep(0.5)
    
            imgs = driver.find_elements(By.TAG_NAME, 'img')
            base_image = ''
            for i in imgs:
                # Get the image URL
                img_url = i.get_attribute('src')

                
                if 'sites/default/files/member/profile-photo' in img_url:
                    # Download the image
                    base_image = img_url.split('/')[-1].split('.')[0]
                    # urlretrieve(img_url, f'{base_image}.jpg')

            buttons = driver.find_elements(By.CSS_SELECTOR, "button.accordion-button")
            buttons[0].click()
            sleep(0.2)
            buttons[2].click()
            sleep(0.2)

            name = driver.find_element(By.CSS_SELECTOR, "h2.field-content").text.rstrip('\n').replace('Hon. ', '')

            riding = driver.find_element(By.ID, "collapseblock-views-block-member-block-8").text.rstrip('\n')

            party = driver.find_element(By.ID, "collapseblock-views-block-member-block-12").text.rstrip('\n')

            mpp_obj = {
                'name': name,
                'constituency': riding.split('\n')[0],
                'party': party.split('\n')[0],
                'image_name': base_image,
            }
            print(mpp_obj)



except Exception as e:
    print(f"Error: {str(e)}")