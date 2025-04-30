from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from urllib.request import urlretrieve
# from PyPDF2 import PdfReader
from pypdf import PdfReader
from time import sleep
import sys
import pymongo
import openai
sys.stdout.reconfigure(encoding='utf-8')
from selenium.webdriver.common.action_chains import ActionChains

# Mongo Key
env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

# Gemini Key
PROMPT = "The provided text is an ethics disclosure for a Canadian politician. Summarize the following text, with an emphasis on itemizing the declared assets, sponsored travel, mutual funds and investments and rental and residential properties owned. Present the content in a passive tone and separate spousal and family assets from the assets of the politician. Do not miss any critical details from the summary. Include mortages in their own category. Include rental properties and rental income in their own category. Include investments and mutual funds in their own category."
gemini_key=''
for line in env:
    if line.startswith('GEMINI_KEY'):
        gemini_key = line.split('GEMINI_KEY=')[1].replace("'", "")

# Mongo Connection
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

# This did a terrible job.
# Never using AI for this again.
def summarize_text(text):
    client = openai.OpenAI(
        api_key='KEY GOES HERE',
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"  # Note: v1beta, not v1main
    )
    
    response = client.chat.completions.create(
        model="gemini-2.0-flash",  # Use flash model instead of base
        messages=[
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": text}
        ],
        temperature=0.3,
        max_tokens=3000
    )
    return response.choices[0].message.content
    
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
        print('$$--$$')
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

def print_object(name, category, content, pdf_url):
    
    # do formatting here

    print({
        'name': name,
        'category': category,
        'content': content,
        'pdf_url': base_ethics_url+pdf_url,
    })

def read_pdf_basic(pdf_path):
    # Create a reader object
    reader = PdfReader(pdf_path)
    
    # Extract text from second page
    text = ""
    for page in reader.pages:
        text += page.extract_text()

    return summarize_text(text) # Need a better solution than using a crap LLM.

for name in name_list:
    print_object(name, 'AI Summary', read_pdf_basic(name_to_pdf_dict[name]), name_to_pdf_dict[name])