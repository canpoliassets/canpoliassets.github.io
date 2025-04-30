
import sys
sys.stdout.reconfigure(encoding='utf-8')
f = open('pe_disclosures_unprocessed.txt', 'r', encoding='utf-8')

name = ''
category = ''
content = ''
for line in f.readlines():
    if '|' not in line:
        name = line.rstrip('\n')
        continue

    if len(line) > 1:
        split = line.split(' | ')
        category = split[0]
        content = split[1].rstrip('\n')

        print({
            'name': name.rstrip(),
            'category': category.rstrip(),
            'content': content.rstrip(),
        })