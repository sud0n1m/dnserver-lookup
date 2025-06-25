import json
import csv
import re
import sys
from typing import List
import dns.resolver
from publicsuffix2 import get_sld

# Load provider regexes
with open('dns_providers.json') as f:
    PROVIDERS = json.load(f)


def guess_provider(nameservers: List[str]) -> str:
    for entry in PROVIDERS:
        for ns in nameservers:
            if re.search(entry['regex'], ns, re.I):
                return entry['provider']
    return "Unknown"


def uses_cloudflare(nameservers: List[str]) -> bool:
    for ns in nameservers:
        if 'cloudflare.com' in ns.lower():
            return True
    return False


def find_ns(domain: str):
    """
    Walk up the domain labels, trying to resolve NS records, stopping at the effective root.
    Returns (nameservers, level_found, error)
    """
    labels = domain.split('.')
    sld = get_sld(domain)
    if not sld:
        sld = domain
    for i in range(len(labels) - len(sld.split('.')) + 1):
        candidate = '.'.join(labels[i:])
        try:
            answers = dns.resolver.resolve(candidate, 'NS')
            nameservers = [str(rdata).rstrip('.') for rdata in answers]
            return nameservers, candidate, None
        except Exception as e:
            last_error = str(e)
        # Stop if we've reached the effective root
        if candidate == sld:
            break
    return [], None, last_error if 'last_error' in locals() else 'No NS found'


def process_domain(domain: str):
    nameservers, found_domain, error = find_ns(domain)
    if nameservers:
        provider = guess_provider(nameservers)
        cloudflare = uses_cloudflare(nameservers)
        dns_response = "; ".join(nameservers)
    else:
        provider = "Error"
        cloudflare = False
        dns_response = error
    return {
        'domain': domain,
        'usesCloudflare': 'Yes' if cloudflare else 'No',
        'provider': provider,
        'dnsResponse': dns_response
    }


def main():
    if len(sys.argv) != 3:
        print("Usage: python bulk_dns_lookup.py input_domains.txt output.csv")
        sys.exit(1)
    input_file = sys.argv[1]
    output_file = sys.argv[2]

    with open(input_file) as f:
        domains = [line.strip() for line in f if line.strip()]

    with open(output_file, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Domain', 'Uses Cloudflare', 'Guessed Provider', 'DNS Response'])
        for i, domain in enumerate(domains, 1):
            result = process_domain(domain)
            writer.writerow([
                result['domain'],
                result['usesCloudflare'],
                result['provider'],
                result['dnsResponse']
            ])
            if i % 1000 == 0:
                print(f"Processed {i} domains...")
    print(f"Done. Results written to {output_file}")


if __name__ == "__main__":
    main() 