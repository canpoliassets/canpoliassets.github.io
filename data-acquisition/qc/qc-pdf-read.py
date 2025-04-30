from pypdf import PdfReader
import sys
sys.stdout.reconfigure(encoding='utf-8')

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
    print(text)

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
            category = "Actifs et Passifs"
            content = ""
            active = False
            continue

        if line.startswith("Nature et source des éléments"):
            print_object(name, category, content)
            category = "Elements"
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

# Usage
read_pdf_basic("stinky lady", 'eric-girard2518.pdf')
# read_pdf_basic2("stinky lady", 'gilles-belanger2472.pdf')