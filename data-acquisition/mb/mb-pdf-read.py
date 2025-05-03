from pypdf import PdfReader
import pymupdf # imports the pymupdf library
import sys
import re
sys.stdout.reconfigure(encoding='utf-8')
pattern = r'^\d{4}/(0[1-9]|1[0-2])/(0[1-9]|[12][0-9]|3[01])$'

def print_content(category, content, name):
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

read_pdf_basic("Nesbitt%20Greg_Riding%20Mountain_2025-03-24T13_32_02.5043472-V2.2.pdf", "jeff")