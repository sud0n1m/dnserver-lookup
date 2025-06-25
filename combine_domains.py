import sys
import csv
import argparse

parser = argparse.ArgumentParser(description='Extract unique domains from a CSV and write to a file.')
parser.add_argument('input_csv', help='Input CSV file (expects a column named "domain")')
parser.add_argument('output_file', help='Output file to write domains to')
parser.add_argument('--append', action='store_true', help='Append to the output file instead of overwriting')
args = parser.parse_args()

# Read existing domains if appending
existing_domains = set()
if args.append:
    try:
        with open(args.output_file, 'r') as f:
            for line in f:
                existing_domains.add(line.strip())
    except FileNotFoundError:
        pass
print(f"Existing domains in output file: {len(existing_domains)}")

# Read domains from input CSV
new_domains = set()
total_rows = 0
with open(args.input_csv, newline='') as csvfile:
    reader = csv.DictReader(csvfile)
    for row in reader:
        total_rows += 1
        domain = row.get('domain')
        if domain:
            new_domains.add(domain.strip())
print(f"Rows read from input CSV: {total_rows}")
print(f"Unique domains found in input CSV: {len(new_domains)}")

# Combine and write
all_domains = existing_domains.union(new_domains)
mode = 'a' if args.append else 'w'
written = 0
with open(args.output_file, mode) as f:
    for domain in sorted(new_domains if args.append else all_domains):
        if domain and (not args.append or domain not in existing_domains):
            f.write(domain + '\n')
            written += 1
print(f"Domains written to output file: {written}")
if args.append:
    print(f"Duplicates skipped: {len(new_domains) - written}")
else:
    print(f"Total unique domains in output file: {len(all_domains)}") 