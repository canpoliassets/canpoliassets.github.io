# from PyPDF2 import PdfReader
from pypdf import PdfReader
import sys
sys.stdout.reconfigure(encoding='utf-8')

def print_content(category, content, name):
    if (content not in ['n/a', 'N/A', "", " n/a"]):
        print({
            'name': name,
            'category': category,
            'content': content
        })

def read_pdf_basic(name, pdf_path):
    # Create a reader object
    reader = PdfReader(pdf_path)
    
    # Extract text from second page
    second_page_text = reader.pages[1].extract_text()

    lines = second_page_text.split("\n")

    off = True
    disclosure_type = ""
    content = ""
    disclosure_bulk = ""
    for line in lines:

        if line.startswith("OFFICES AND DIRECTORSHIPS"):
            off = False
            continue

        if (off):
            continue

        disclosure_bulk += line + "\n"

    disclosure_bulk = disclosure_bulk.lstrip()
    # disclosure_bulk = disclosure_bulk.replace(" \n \n \n", "")
    disclosure_bulk = disclosure_bulk.rstrip()
    print(disclosure_bulk)

# Usage

# read_pdf_basic("Hal Perry", 'Hal%20Perry.public%20disclosure.April%2010%2C%202024.pdf')
read_pdf_basic("Rob Henderson", 'Robert%20Henderson.public%20disclosure.April%2010%2C%202024.pdf')