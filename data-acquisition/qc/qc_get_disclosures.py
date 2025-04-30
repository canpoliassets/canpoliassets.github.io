from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import Select
from urllib.request import urlretrieve
from slugify import slugify
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

qc_disclosures = mydb["quebec_disclosures"]
qc_mnas = mydb["quebec_mnas"]

# Set up the driver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
            
# Navigate to the webpage
url = "https://www.ced-qc.ca/fr/registres-publics/sommaires-des-declarations-des-interets-personnels/22-membres-du-conseil-executif-et-deputes"
driver.get(url)

# Wait for JavaScript to load (adjust timing as needed)
driver.implicitly_wait(8)
sleep(1)

accept_button = driver.find_element(By.ID, 'didomi-notice-agree-button')
accept_button.click()

# Letter Clickers
letter_buttons = driver.find_elements(By.CSS_SELECTOR, 'a[href="#"][data-onglet]')
sleep(1)

name_to_pdf_dict = dict()
name_list = []

letter_sections = driver.find_elements(By.CSS_SELECTOR, 'ul[data-onglet]')

for i in range(0, len(letter_sections)):

    # print(letter_sections[i].get_attribute('data-onglet'))
    letter_buttons[i].click()

    li_root_elements = letter_sections[i].find_elements(By.CSS_SELECTOR, "li:has(ul)")
    for j in range(0, len(li_root_elements)):
        unfixed_name = li_root_elements[j].text.split("\n")[0]
        unfixed_first_name = unfixed_name.split(", ")[1]
        first_name = unfixed_first_name.split(" (")[0]
        last_name = unfixed_name.split(", ")[0]
        name_capital = first_name + " " + last_name
        name = name_capital[0]
        for letter in range(1, len(name_capital)):
            if name_capital[letter-1] not in [" ", "-"]:
                name += name_capital[letter].lower()
            else:
                name += name_capital[letter]

        # Fix official typos / inconsistencies
        if name == "Kateri Champage Jourdain":
            name = "Kateri Champagne Jourdain"

        # Fix official typos / inconsistencies
        if name == "Sylvie D'amours":
            name = "Sylvie D'Amours"

        # Fix official typos / inconsistencies
        if name == "Sylvie D'amours":
            name = "Sylvie D'Amours"

        # Fix official typos / inconsistencies
        if name == "Sonia Lebel":
            name = "Sonia LeBel"

        # Fix official typos / inconsistencies
        if name == "Désirée Mcgraw":
            name = "Désirée McGraw"

        if name not in ["Eric Girard", "Éric Girard"]:
            found = qc_mnas.find_one({ 'name': name }, { 'collation' : {'locale': "fr_CA", 'strength': 2 }})
        else:
            found = qc_mnas.find_one({ 'name': name })

        if not found:
            print("Error for", name)

        pdf_tag = li_root_elements[j].find_element(By.TAG_NAME, 'a')
        if "2022-2023" not in pdf_tag.text:
            pdf_tag = li_root_elements[j].find_elements(By.TAG_NAME, 'a')[1]

        pdf_url = pdf_tag.get_attribute('href')
        pdf_name = slugify(name) + pdf_url.split('/')[-1].split('"')[0] + ".pdf"
        name_to_pdf_dict[name] = pdf_name
        name_list.append(name)
        # urlretrieve(pdf_url, pdf_name)

def print_object(name, category, content):
    content = content.rstrip(" ")
    if not content.startswith('Ne s’applique pas'):
        if not content.startswith("Aucun autre renseignement"):
            print({
                'name': name,
                'category': category,
                'content': content,
            })

def read_pdf_basic(name, pdf_path):
    # Create a reader object
    reader = PdfReader(pdf_path)
    
    # Extract text from second page
    text = ""
    for page in reader.pages:
        text += page.extract_text()

    category = ""
    content = ""
    active = False
    for line in text.split("\n"):
        line = line.replace("\uf0a7", "▪")

        if line.startswith("Nature et source des rev"):
            category = "Revenus"
            content = ""
            active = False
            continue

        if line.startswith("Immeuble sur lequel la"):
            print_object(name, category, content)
            category = "Immeuble sur lequel la députée ou le député détient un intérêt et qui fait l’objet d’un avis d’expropriation"
            content = ""
            active = False
            continue

        if line.startswith("Nature et source des éléments"):
            print_object(name, category, content)
            category = "Actifs et Passifs"
            content = ""
            active = False
            continue

        if line.startswith("Immeuble faisant partie de"):
            print_object(name, category, content)
            category = "Actifs expropriés"
            content = ""
            active = False
            continue

        if line.startswith("Identification du créancier"):
            print_object(name, category, content)
            category = "Emprunt Monétaire"
            content = ""
            active = False
            continue

        if line.startswith("Nature de l’activité professionnelle"):
            print_object(name, category, content)
            category = "Activité professionnelle, commerciale et/ou industrielle précédent l'assermentation"
            content = ""
            active = False
            continue

        if line.startswith("Objet et nature de l’avantage reçu"):
            print_object(name, category, content)
            category = "NEVER GETS USED (translate later)"
            content = ""
            active = False
            continue

        if line.startswith("Objet et la nature d’un marché"):
            print_object(name, category, content)
            category = "NEVER GETS USED (translate later)"
            content = ""
            active = False
            continue

        if line.startswith("Identification de tout intérêt fais"):
            print_object(name, category, content)
            category = "Fiducie ou mandat sans droit de regard"
            content = ""
            active = False
            continue

        if line.startswith("Nom des entreprises"):
            print_object(name, category, content)
            category = "Entreprises, personnes, morales, sociétés et associations, mentionnées"
            content = ""
            active = False
            continue

        if line.startswith("Montant reçu d’un parti politique"):
            print_object(name, category, content)
            category = "Montant reçu d’un parti politique ou d’une instance de parti politique autorisée précédent l'assermentation"
            content = ""
            active = False
            continue

        if line.startswith("Renseignements relatifs à "):
            print_object(name, category, content)
            category = "Succession ou fiducie, dont la ou le membre est bénéficiaire pour une valeur de 10 000 $ et plus"
            content = ""
            active = False
            continue

        if line.startswith("Autres renseignements"):
            print_object(name, category, content)
            category = "Autres renseignements"
            content = ""
            active = False
            continue

        if line.startswith("Membre de la famille immédiate"):
            print_object(name, category, content)
            break

        # if line.startswith("-1-") or line.startswith("-2-") or line.startswith("-3-") or line.startswith("-4-"):
        #     continue

        if "°" in line:
            active = True
            continue

        if active and len(line) > 2:
            content += line

for name in name_list:
    read_pdf_basic(name, name_to_pdf_dict[name])