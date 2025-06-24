import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';

const PROVIDER_REGEXES: { [key: string]: RegExp } = {
  Cloudflare: /cloudflare\.com$/i,
  Google: /google\.com$/i,
  'AWS Route53': /awsdns\d*\.net$/i,
  GoDaddy: /domaincontrol\.com$/i,
  DigitalOcean: /digitalocean\.com$/i,
  Namecheap: /registrar-servers\.com$/i,
  Bluehost: /bluehost\.com$/i,
  DreamHost: /dreamhost\.com$/i,
  '1&1 IONOS': /ionos\.com$/i,
  'Name.com': /name\.com$/i,
};

function guessProvider(nsRecords: string[]): string {
  for (const [provider, regex] of Object.entries(PROVIDER_REGEXES)) {
    if (nsRecords.some(ns => regex.test(ns))) {
      return provider;
    }
  }
  return 'Unknown';
}

export async function POST(req: NextRequest) {
  const { domains } = await req.json();
  if (!Array.isArray(domains)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const results = await Promise.all(domains.map(async (domain: string) => {
    let nsRecords: string[] = [];
    let usesCloudflare = false;
    let provider = 'Unknown';
    let dnsResponse = '';
    try {
      nsRecords = (await dns.resolveNs(domain)) || [];
      usesCloudflare = nsRecords.some(ns => /cloudflare\.com$/i.test(ns));
      provider = guessProvider(nsRecords);
      dnsResponse = nsRecords.join(', ');
    } catch (e: any) {
      dnsResponse = e.message || 'Error';
    }
    return {
      domain,
      usesCloudflare,
      provider,
      dnsResponse,
    };
  }));

  return NextResponse.json({ results });
} 