import os
import json
import optparse

# initialize the parser
usage = 'script.py -i <input_file> -o output_file'
parser = optparse.OptionParser(usage = usage)
parser.add_option("-i", "--input_file", dest="input_file", default=None,
                   help='Input csv file')
parser.add_option("-o", "--output_file", dest="output_file", default=None,
                   help='output json file')

(opts, args) = parser.parse_args()
l = []

def convert():

    f = open(opts.input_file)
    topic = f.readline().split(',')
    for line in f.readlines():
        temp = line.split(';')[-1].split(',')
        temp_dict = {}

        for i in range(1,len(temp)):
            #temp_dict.update({topic[i].strip():temp[i].strip()})
            # To get empty string for value
            temp_dict.update({topic[i].strip():""})

        d = {}
        d.update({temp[0]:temp_dict})

        l.append(d)

convert()
f = open(opts.output_file, 'w')
f.write(json.dumps(l))
