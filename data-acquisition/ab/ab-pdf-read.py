# from PyPDF2 import PdfReader # Works substantially worse
from pypdf import PdfReader

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
        if ("Source " in line and "Nature of Income" in line) or line.startswith("Source") or line.startswith("Nature of Income"):
            continue

        if "ASSETS" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Property"
            content = ""
            continue

        if "Registered Retirement Savings Plans" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Assets"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "Bank, Trust Company or Other Financial" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Assets"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "Publicly Traded Securities (stocks and" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Securities & RRSP"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "bonds) and Registered Retirement Savings" in line:
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "Canada Savings Bonds,  Guaranteed" in line or "Canada Savings Bonds, Guaranteed" in line or "Canada Savings Bonds , Guaranteed" in line or "Canada Savings Bonds and Investments" in line or "Canada  Savings Bonds and Investments" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Assets"
            content = ""
            continue

        if "Mutual Funds" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Mutual Funds"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "Guaranteed Investment Certificates" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Investment"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "Annuities and Life Insurance Policies" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Insurance Policies"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "Pension Rights" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Pension"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "Other Assets" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Assets"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "Gifts and Personal Benefits" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Gifts"
            content = ""

        if "Travel on " in line and "Aircraft" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Travel"
            content = ""

        if "LIABILITIES" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Mortgages"
            content = ""
            continue

        if "Loans or Lines of Credit" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Liabilities"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "Guarantees" in line:
            print_content(disclosure_type, content, name)
            disclosure_type = "Liabilities"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if line.startswith("Other") and not line.startswith("Other Assets"):
            print_content(disclosure_type, content, name)
            disclosure_type = "Liabilities"
            content = ""
            if "  " not in line or len(line.split("  ")) == 1 or line.split("  ")[1].isspace() or len(line.split("  ")[1]) == 0:
                continue

        if "FINANCIAL INTERESTS" in line:
            if content != 'Other n/a':
                print_content(disclosure_type, content, name)
            disclosure_type = "Financial Interests"
            content = ""
            continue
        
        if "  " in line.rstrip(" "):
            split = line.rstrip(" ").split("  ")
            line = ""
            for i in range(1, len(split)):
                line += split[i] + " "

        if len(content) == 0:
            content += line.rstrip(" ")
        else:
            content += "\n"+line.rstrip(" ")

def read_pdf_basic2(name, pdf_path):
    # Create a reader object
    reader = PdfReader(pdf_path)
    
    # Extract text from second page
    second_page_text = reader.pages[1].extract_text()
    print(second_page_text)

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

        
        

# Usage
read_pdf_basic2("Name Goes Here", 'name_of_pdf.pdf')