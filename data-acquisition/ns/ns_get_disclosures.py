f = open('ns_disclosures_unfiltered.txt', 'r')

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
            'name': name,
            'category': category,
            'content': content,
        })