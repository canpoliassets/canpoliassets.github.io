### FOREWORD ABOUT THE DATA

So you have 1 federal government, 10 provincial governments and 3 territorial governments all with
their own systems, standards and websites for releasing public ethics disclosures
that include conflicts of interest etc etc.

How do you even start?

Well it's a mess, but we'll try to break it down concisely.

### Folder Structure
Each folder corresponds to a specific jurisdiction.

The process is generally:

1. Obtain the representatives information like this and download required images:
{
    name: 'First Last',
    party: 'Rhino Party',
    constituency: 'City Center',
    image_name: 'first_last.png'
}

2. Obtain the disclosures information like this and download any required PDFs:
{
    name: 'First Last',
    category: 'Financial Liabilities',
    content: 'Mortgage with Big Bank'
}

We generally include 3 files:
X_get_mlas.py - Obtains the representatives name, party, constituency and images from the official portal.
X_get_disclosures.py - Obtains the disclosure data for the representatives.
X_pdf-read.py - This file is just to test and debug the PDF reading logic for jurisdictions that have PDF files for their disclosures.


### The Problem
Because each jurisdiction has wildly different data quality, website quality and overall strategies for how they present this info, the approach
to getting it is HIGHLY customized to each, and the drawbacks/limitations/gotchas are different for each.

Therefore we include a README for each jurisdiction going into specific detail about what works well, and what doesn't.

### Summary of Data 
Federal:
HTML Data. Quite consistent, but has incredibly specific details related to how it is released and how it must be processed. Very slow to obtain.

Provinces:
BC - PDF Data. Awaiting new data.
AB - PDF Data. Highly consistent. Easy to process.
SK - PDF Data. Awaiting new data.
MB - PDF Data. Difficult to process with typical PDF parsers. We used an LLM to try and summarize it, and it did a bad job.
ON - HTML Data. Awaiting new data. Highly consistent, challenging to process. Very slow to obtain.
QC - PDF Data. Fairly consistent. Easy to process.
NS - PDF Data is released in a single, giant, hand-written PDF. Must be processed by hand. Horrific.
NB - PDF Data. Awaiting new data.
PE - PDF Data. Somewhat consistent. Hard to process. We did it by hand because dataset is small.
NL - Does not release anything, everything we have is self-disclosed after investigative reporter Isaac Peltz bugged them about it.

Territories:
YK - PDF Data. TODO.
NT - Does not release anything. Territorial Government does not follow a similar structure to provinces.
NU - Does not release anything. Territorial Government does not follow a similar structure to provinces.