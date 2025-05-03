from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from urllib.request import urlretrieve
from time import sleep
import sys
import pymongo
import pymupdf
import re

pattern = r'^\d{4}/(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])$'
sys.stdout.reconfigure(encoding='utf-8')
from selenium.webdriver.common.action_chains import ActionChains

# Mongo Connection
env = open('../../.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

mb_disclosures = mydb["manitoba_disclosures"]
mb_mlas = mydb["manitoba_mlas"]

name_to_pdf_dict = dict()
name_list = []

# Utility Methods
def force_click(driver, element):
    actions = ActionChains(driver)
    actions.move_to_element(element)
    actions.click(element)
    actions.perform()
    
# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            
# Navigate to the webpage
url = "https://ethicsmanitoba.ca/PublicDisclosure/SearchMember"
base_ethics_url='https://ethicsmbblob.blob.core.windows.net/member-disclosure/'
driver.get(url)
driver.fullscreen_window()

# Set up filters
driver.implicitly_wait(4)
sleep(0.5)

all_selections = driver.find_elements(By.CLASS_NAME, 'form-group')

force_click(driver, all_selections[2])
statement_options = driver.find_element(By.ID, "select2-statementdropdown-results")
disclosure_option = statement_options.find_elements(By.TAG_NAME, 'li')[1]
disclosure_option.click()
sleep(0.5)

name_button = driver.find_elements(By.CLASS_NAME, 'form-group')[0]
force_click(driver, all_selections[1])
member_options = driver.find_element(By.ID, "select2-memberdropdown-results")

submit_button = driver.find_element(By.ID, 'submit')
force_click(driver, all_selections[1])
sleep(1)

for i in range(1, 60):
    force_click(driver, all_selections[1])
    name = member_options.find_elements(By.TAG_NAME, 'li')[i]
    corrected_name = name.text.split(', ')[1] + ' ' + name.text.split(', ')[0]
    name.click()
    sleep(1)

    # Disclosure Portal has no accent. . .
    if corrected_name == "Renee Cable":
        corrected_name = "Renée Cable"

    # Disclosure portal uses nickname. . .
    if corrected_name == "JD Devgan":
        corrected_name = "Jasdeep Devgan"
    
    mla_exists = mb_mlas.find_one({ 'name': corrected_name })

    if mla_exists is None:
        # print(f'Could not find MLA {corrected_name} in the database')
        print('$$--$$', corrected_name)
        continue

    sleep(0.5)
    submit_button.click()
    sleep(3)

    pdf_tags = driver.find_elements(By.CSS_SELECTOR, "td a[target='_blank']")

    if len(pdf_tags) == 0:
        # print(f'{corrected_name} has no disclosures.')
        print('$$--$$')
        continue

    pdf_url = pdf_tags[0].get_attribute('href')
    pdf_name = pdf_url.split('/')[-1].split('"')[0]
    name_to_pdf_dict[corrected_name] = pdf_name
    name_list.append(corrected_name)
    # urlretrieve(pdf_url, pdf_name)

sleep(1)

def print_content(category, content, name):
    # Second check catches page overflow cases, and doesn't remove relevant content.
    if content != '' and not content.startswith("Name of "):
        print({
            'name': name,
            'category': category,
            'content': content
        })

def read_pdf_basic(pdf_path, name):
    # Create a reader object
    reader = pymupdf.open(pdf_path)

    # Extract text from second page
    text = ""
    for page in reader:
        text += page.get_text()

    lines = text.split("\n")
    category = ""
    content = ""
    active = False
    applicable = False
    for line in lines:
        # print(line)
        if re.match(pattern, line):
            continue

        if line.startswith("Not Applicable: Yes"):
            applicable = False
            active = False
            category = ""
            content = ""
            continue

        if line.startswith("Not Applicable: No"):
            applicable = True
            active = False
            continue

        if line.startswith("A3"):
            category = "Directorships"
            applicable = False
            active = False
            continue

        if line.startswith("B1"):
            category = "Real Property Interests"
            applicable = False
            active = False
            continue

        if line.startswith("B2"):
            category = "Money Owed and Secured by a Mortgage on Real Property"
            applicable = False
            active = False
            continue

        if line.startswith("B3"):
            category = "Money Owed and Secured by Personal Property"
            applicable = False
            active = False
            continue

        if line.startswith("B4"):
            category = "Other Money Owed"
            applicable = False
            active = False
            continue

        if line.startswith("B5"):
            category = "Mutual Funds, ETFs and Other Funds"
            applicable = False
            active = False
            continue

        if line.startswith("B6"):
            category = "Securities and Other Interests in Public Corporations"
            applicable = False
            active = False
            continue

        if line.startswith("B7"):
            category = "Interests in Private Corporations"
            applicable = False
            active = False
            continue

        if line.startswith("B8"):
            category = "Contracts with the Government of Manitoba"
            applicable = False
            active = False
            continue

        if line.startswith("B9"):
            category = "Other Private Business Interests"
            applicable = False
            active = False
            continue

        if line.startswith("B10"):
            category = "Trust Property"
            applicable = False
            active = False
            continue

        if line.startswith("B11"):
            category = "Guarantees"
            applicable = False
            active = False
            continue

        if line.startswith("B12"):
            category = "Other Assets"
            applicable = False
            active = False
            continue

        if line.startswith("B13"):
            category = "Assets Held in Commissioner Approved Trust"
            applicable = False
            active = False
            continue

        if category == "Assets Held in Commissioner Approved Trust" and "Yes" in line:
            print_content(category, "Yes", name)
            continue

        if line.startswith("C1"):
            category = "Employment"
            applicable = False
            active = False
            continue

        if line.startswith("C2"):
            category = "Business or Profession"
            applicable = False
            active = False
            continue

        if line.startswith("C3"):
            category = "Other Renumerations"
            applicable = False
            active = False
            continue

        if line.startswith("D1"):
            category = "Mortgages"
            applicable = False
            active = False
            continue

        if line.startswith("D2"):
            category = "Guarantees"
            applicable = False
            active = False
            continue

        if line.startswith("D3"):
            category = "Unpaid Municipal Property Taxes"
            applicable = False
            active = False
            continue

        if line.startswith("D4"):
            category = "Other Unpaid Taxes"
            applicable = False
            active = False
            continue

        if line.startswith("D5"):
            category = "Support Payments"
            applicable = False
            active = False
            continue

        if line.startswith("D6"):
            category = "Other Liabilities"
            applicable = False
            active = False
            continue

        if line.startswith("E1"):
            category = "Legal Proceedings"
            applicable = False
            active = False
            continue

        if line.startswith("E2"):
            # Print Legal Proceedings from previous.
            if applicable == True and active == True:
                print_content(category, content, name)
                content = ""
            category = "Activities Approved by the Commissioner"
            applicable = False
            active = False
            continue

        if line.startswith("Date of Change") and applicable == True:
            active = True
            continue

        # Clear Spousal / Dependent Content
        if line == "S" and applicable == True and active == True:
            print_content(category +" (Spouse)", content, name)
            # active = False
            content = ""
            continue

        if line == "D" and applicable == True and active == True:
            print_content(category +" (Dependent)", content, name)
            # active = False
            content = ""
            continue
        
        if line == "M" and applicable == True and active == True:
            print_content(category, content, name)
            # active = False
            content = ""
            continue

        if active == True and applicable == True:
            content += line + "\n"

for name in name_list:
    read_pdf_basic(name_to_pdf_dict[name], name)