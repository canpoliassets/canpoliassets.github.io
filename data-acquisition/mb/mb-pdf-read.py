from pypdf import PdfReader
import openai

PROMPT = "The provided text is an ethics disclosure for a Canadian politician. Summarize the following text, with an emphasis on itemizing the declared assets, sponsored travel, mutual funds and investments and rental and residential properties owned. Present the content in a passive tone and separate spousal and family assets from the assets of the politician. Do not miss any critical details from the summary. Include mortages in their own category. Include rental properties and rental income in their own category. Include investments and mutual funds in their own category."
env = open('.env')
gemini_key=''
for line in env:
    if line.startswith('GEMINI_KEY'):
        gemini_key = line.split('GEMINI_KEY=')[1].replace("'", "")

def summarize_text(text):
    client = openai.OpenAI(
        api_key=gemini_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"  # Note: v1beta, not v1main
    )
    
    response = client.chat.completions.create(
        model="gemini-2.0-flash",  # Use flash model instead of base
        messages=[
            {"role": "system", "content": PROMPT},
            {"role": "user", "content": text}
        ],
        temperature=0.3,
        max_tokens=1000
    )
    
    return response.choices[0].message.content

def read_pdf_basic(pdf_path):
    # Create a reader object
    reader = PdfReader(pdf_path)
    
    # Extract text from second page
    text = ""
    for page in reader.pages:
        text += page.extract_text()

    # print(text)

    print(summarize_text(text))

    # lines = text.split("\n")
    # category = ""
    # content = ""
    # active = False
    # for line in lines:
    #     if line.startswith("Not Applicable: Yes"):
    #         category = ""
    #         content = ""
    #         continue

    #     if line.startswith("A3"):
    #         category = "Directorships"
    #         continue




    # category = ""
    # content = ""
    # active = False
    # for line in text.split("\n"):
    #     line = line.replace("\uf0a7", "▪")

    #     if line.startswith("Nature et source des rev"):
    #         category = "Revenus"
    #         content = ""
    #         active = False
    #         continue
# Name of corporation or organizationPosition held M S D Date of Change

read_pdf_basic("Kinew%20Wab_Fort%20Rouge_2025-02-07T16_50_32.4227749-V2.1.pdf")
# read_pdf_basic("Moyes%20Mike_Riel_2025-03-03T11_58_21.7466189-V2.1.pdf")