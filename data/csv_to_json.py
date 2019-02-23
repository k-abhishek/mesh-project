#!/usr/bin/python

# import libraries
import sys # for argument vector
import optparse # to parse arguments
import json # to convert dictionary to json

# describe what the script does
what_i_do = "Script to convert csv or tsv matricies with hierarchies into json format for dendro_heatmap"
usage = "value_to_none.py -i <input_file> -o output_file"

# initialize the parser
parser = optparse.OptionParser(usage = usage, epilog = what_i_do)
parser.add_option("-i", "--input_file", dest="input_file", default=None,
                   help='Input csv/tsv file to turn into dentro_heatmap compatible json [Required]')
parser.add_option("-o", "--output_file", dest="output_file", default=None,
                   help='output json file [Required]')

def check_arguments(opts):
    if not opts.input_file:
        print "Error: Input file not specified"
        print usage
        exit()

sep = "," # file delimiter

def add_lineage(lineage, values, tree_structure, samples, first=False):

    taxa = lineage[0]
    # recursively add new data
    node_names = [] # list of current children
    for node in tree_structure:
        if "name" in node:
            node_names.append(node["name"])

    if len(lineage) > 1:
        if taxa not in node_names:
           # create new node with names
           new_node = {"name": taxa,
                       "children": []}
           tree_structure.append(new_node)
        else:
           # add children to existing node if nessisary
           for node in tree_structure:
               if node["name"] == taxa:
                   if "children" not in node:
                       node["children"] = []
               break
        for node in tree_structure:
           if node["name"] == taxa:
               add_lineage(lineage[1:], values, node["children"], samples)
               break
    else:
        # at base case add data
        if taxa not in node_names:
            # create new node with names
            new_node = {"name": taxa,
                        "values": {}}
            #for i in range(len(samples)):
            #    #new_node["values"][samples[i]] = values[i]
            #    new_node["values"][samples[i]] = {}
            tree_structure.append(new_node)
        else:
            for node in tree_structure:
                if node["name"] == taxa:
                    if "values" not in node:
                        # initialize values
                        node["values"] = {}
                        for i in range(len(samples)):
                            node["values"][samples[i]] = values[i]
                    else:

                        for i in range(len(samples)):
                            node["values"][samples[i]] += values[i]
                    break

# extract samples
def cleanLine(line):
    fields = line.split(sep)
    fields = map(str.strip, fields)
    fields = map(str.strip, fields, "\n")
    return fields

# the main function of the script
def main():
    (opts, args) = parser.parse_args()
    # opts is a dictionary that contains all the options
    check_arguments(opts)
    tree_structure = []
    samples = []
    tsv = False

    with open(opts.input_file, "r") as fh:
        header = fh.readline()
        fields = cleanLine(header)
        samples = fields[1:]
        for line in fh:
            fields = cleanLine(line)
            lineage = fields[0].split(";")
            values = fields[1:]
            add_lineage(lineage, values, tree_structure, samples)
    out_fh = open(opts.output_file, "w")
    json_file = json.dumps(tree_structure[0], indent=3, separators=(',', ': '))
    out_fh.write(json_file)
    out_fh.close()

if __name__ == "__main__":
    main()
