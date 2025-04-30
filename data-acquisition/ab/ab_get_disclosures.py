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
sys.stdout.reconfigure(encoding='utf-8')

env = open('.env')
mongo_uri=''
for line in env:
    if line.startswith('MONGO_URI'):
        mongo_uri = line.split('MONGO_URI=')[1].replace("'", "")

myclient = pymongo.MongoClient(mongo_uri)
mydb = myclient["public_gov"]

ab_disclosures = mydb["alberta_disclosures"]
ab_mlas = mydb["alberta_mlas"]

# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            
# Navigate to the webpage
url = "https://www.ethicscommissioner.ab.ca/disclosure/mla-public-disclosure/"
driver.get(url)

# Wait for JavaScript to load (adjust timing as needed)
driver.implicitly_wait(8)
sleep(1)

a_tags = driver.find_elements(By.TAG_NAME, 'a')
sleep(1)

name_to_pdf_dict = dict()
name_list = []

for tag in a_tags:
    if ", " in tag.text:
        name_split = tag.text.split(", ")
        name = name_split[1] + " " + name_split[0]

        # Names that do not match the Alberta MLA website
        if name == "Rod Loyola":
            name = "Rodrigo Loyola"
        
        if name == "Chantelle De Jonge":
            name = "Chantelle de Jonge"
        
        if name == "Peter Guthrie":
            name = "Pete Guthrie"
        
        if name == "Ronald Wiebe":
            name = "Ron Wiebe"
        
        found = ab_mlas.find_one({ 'name': name})

        if not found:
            print("Error for", name)
        
        
        pdf_url = tag.get_attribute('href')
        pdf_name = pdf_url.split('/')[-1].split('"')[0]
        name_to_pdf_dict[name] = pdf_name
        name_list.append(name)

        # urlretrieve(pdf_url, pdf_name)

def print_content(category, content, name):
    if (content not in ['n/a', 'N/A', "", " n/a"]):
        print({
            'name': name,
            'category': category,
            'content': content
        })

def read_pdf_basic2(name, pdf_path):
    # Create a reader object
    reader = PdfReader(pdf_path)
    
    # Extract text from second page
    second_page_text = reader.pages[1].extract_text()
    # print(second_page_text)

    lines = second_page_text.split("\n")

    disclosure_type = ""
    content = ""
    for line in lines:
        if (disclosure_type == "" and "INCOME" not in line):
            continue

        if (line.isspace() or line == "\n"):
            continue

        if line in ["N/A", "n/a"]:
            content = ""
            continue
        
        if "INCOME" in line:
            disclosure_type = "Income"
            continue
        
        if line.startswith("Source") and disclosure_type == "Income":
            continue
    
        if line.startswith("Nature of Income") and disclosure_type == "Income":
            continue

        if line.startswith("ASSETS"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Assets"
            content = ""
            continue

        if line.startswith("Real Property"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Property"
            content = ""
            line = line.replace("Real Property ", "")

        if line.startswith("Bank, Trust Company or Other Financial"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Financial Assets"
            content = ""
            continue

        if line.startswith("Institution") and line.replace("Institution", "").isspace():
            continue

        if line.startswith("Publicly Traded Securities"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Securities"
            content = ""
            continue

        if "and Registered Retirement" in line:
            continue

        if line.startswith("Plans") and disclosure_type == "Securities":
            continue

        if line.startswith("Canada Savings Bonds"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Bonds & Certificates"
            content = ""
            continue

        if "Guaranteed by Government" in line and disclosure_type == "Bonds & Certificates":
            continue

        if line.rstrip(" \n").endswith("Certificates") and disclosure_type == "Bonds & Certificates":
            continue

        if line.startswith("Mutual Funds"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Mutual Funds"
            content = ""
            line = line.replace("Mutual Funds ", "")

        if "Guaranteed Investment Certificates" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Bonds & Certificates"
            content = ""
            continue

        if line.startswith("Similar Instruments") and disclosure_type == "Bonds & Certificates":
            continue

        if line.startswith("Annuities and Life Insurance Policies"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Annuities and Life Insurance Policies"
            content = ""
            line = line.replace("Annuities and Life Insurance Policies ", "")

        if line.startswith("Pension Rights"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Pension Rights"
            content = ""
            line = line.replace("Pension Rights ", "")

        if line.startswith("Other Assets"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Assets"
            content = ""
            line = line.replace("Other Assets ", "")

        if line.startswith("Gifts and Personal Benefits"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Gifts"
            content = ""
            line = line.replace("Gifts and Personal Benefits ", "")
            
        if line.startswith("Travel on Non-commercial Aircraft"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Travel"
            content = ""
            line = line.replace("Travel on Non-commercial Aircraft ", "")
            
        if line.startswith("LIABILITIES"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Liabilities"
            content = ""
            continue
            
        if line.startswith("Mortgages"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Mortgages"
            content = ""
            line = line.replace("Mortgages ", "")
            
        if line.startswith("Loans or Lines of Credit"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Loans or Lines of Credit"
            content = ""
            line = line.replace("Loans or Lines of Credit ", "")
            
        if line.startswith("Guarantees"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Guarantees"
            content = ""
            line = line.replace("Guarantees ", "")
            
        if line.startswith("Other") and not line.startswith("Other Assets"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Liabilities"
            content = ""
            line = line.replace("Other ", "")
            
        if line.startswith("FINANCIAL INTERESTS"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Financial Interests"
            content = ""
            continue

        if len(content) == 0:
            content += line.rstrip(" ")
        else:
            content += "\n"+line.rstrip(" ")

for name in name_list:
    read_pdf_basic2(name, name_to_pdf_dict[name])
