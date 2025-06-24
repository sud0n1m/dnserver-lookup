import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';
import { promises as fs } from 'fs';
import path from 'path';

let PROVIDER_REGEXES_CACHE: { provider: string, regex: RegExp }[] | null = null;

async function getProviderRegexes() {
  if (PROVIDER_REGEXES_CACHE) return PROVIDER_REGEXES_CACHE;
  const filePath = path.join(process.cwd(), 'dns_providers.json');
  let list = [];
  try {
    const json = await fs.readFile(filePath, 'utf-8');
    list = JSON.parse(json);
  } catch (e) {
    list = [];
  }
  PROVIDER_REGEXES_CACHE = Array.isArray(list)
    ? list.map((entry: { provider: string, regex: string }) => ({
        provider: entry.provider,
        regex: new RegExp(entry.regex, 'i'),
      }))
    : [];
  return PROVIDER_REGEXES_CACHE;
}

async function guessProvider(nsRecords: string[]): Promise<string> {
  const regexes = await getProviderRegexes();
  for (const { provider, regex } of regexes) {
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
      provider = await guessProvider(nsRecords);
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