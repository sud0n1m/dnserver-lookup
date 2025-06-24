import { NextRequest, NextResponse } from 'next/server';
import { promises as dns } from 'dns';

const PROVIDER_REGEXES: { [key: string]: RegExp } = {
  // Major Global Managed DNS Providers
  'Akamai Edge DNS': /\.akamaiedgedns\.(com|net)$/i,            // e.g. ns1-2048.akamaiedgedns.net
  'Amazon Route 53': /awsdns-[0-9a-z]+\.(?:com|net|org|co\.uk)$/i, // e.g. ns-2048.awsdns-64.net
  'Azure DNS': /\.azure-dns\.(?:com|net|org|info)$/i,           // e.g. ns1-xyz.azure-dns.net
  'Google Cloud DNS': /\.(?:ns-cloud-[a-z]\d+)\.googledomains\.com$/i, // e.g. ns-cloud-a1.googledomains.com
  'Cloudflare': /\.(?:ns[0-9]+\.)?cloudflare\.com$/i,          // e.g. alice.ns.cloudflare.com

  // Specialist / API-driven Providers
  'NS1': /\.nsone\.net$/i,                                      // e.g. dns1.p06.nsone.net
  'DNS Made Easy': /\.dnsmadeeasy\.com$/i,                      // e.g. ns1.dnsmadeeasy.com
  'Dyn (Oracle Dyn DNS)': /\.dynect\.net$/i,                    // e.g. ns1.dynect.net
  'easyDNS': /\.easydns\.com$/i,                                // e.g. anycast.easydns.com
  'DNSimple': /\.dnsimple\.com$/i,                              // e.g. ns1.dnsimple.com

  // Cloud-hosted / IaaS Providers
  'DigitalOcean': /\.digitalocean\.com$/i,                      // e.g. ns1.digitalocean.com
  'Linode': /\.linode\.com$/i,                                  // e.g. ns1.linode.com
  'Hetzner': /\.dns\.hetzner\.com$/i,                           // e.g. ns1.dns.hetzner.com
  'OVHcloud': /\.ovh\.(?:net|com|ca|us|co\.uk|cloud)$/i,        // e.g. dns19.ovh.net
  'Alibaba Cloud DNS': /\.alidns\.com$/i,                       // e.g. dns.aliyun.com
  'Oracle Cloud DNS': /\.oraclecloud\.net$/i,                  // e.g. ns1.p06.dns.oraclecloud.net

  // Registrar-backed / Hosting Providers
  'GoDaddy': /\.domaincontrol\.com$/i,                          // e.g. nsXX.domaincontrol.com
  'Namecheap': /\.registrar-servers\.com$/i,                    // e.g. dns1.registrar-servers.com
  'Bluehost': /\.bluehost\.com$/i,                              // e.g. ns1.bluehost.com
  'DreamHost': /\.dreamhost\.com$/i,                            // e.g. ns1.dreamhost.com
  'HostGator': /\.hostgator\.com$/i,                            // e.g. hgns1.hostgator.com
  '1&1 IONOS': /\.ionos\.com$/i,                                // e.g. ns1.ionos.com
  'Name.com': /\.name\.com$/i,                                  // e.g. ns1.name.com
  'iPage': /\.ipage\.com$/i,                                    // e.g. ns1.ipage.com
  'Register.com': /\.register\.com$/i,                          // e.g. ns1.register.com
  'Network Solutions': /\.worldnic\.com$/i,                     // e.g. ns1.worldnic.com
  'NameSilo': /\.namesilo\.com$/i,                              // e.g. ns1.namesilo.com
  'ClouDNS': /\.cloudns\.net$/i,                                // e.g. sdns1.cloudns.net
  'BuddyNS': /\.buddyns\.com$/i,                                // e.g. ns1.buddyns.com
  'TransIP': /\.transip\.(?:net|nl|eu)$/i,                      // e.g. ns0.transip.net
  'Hurricane Electric': /\.he\.net$/i,                          // e.g. ns1.he.net
  '1984 Hosting': /\.1984hosting\.com$/i,                       // e.g. ns*.1984hosting.com
  'Geoscaling': /\.geoscaling\.com$/i,                          // e.g. ns1.geoscaling.com
  'DNSPod': /\.dnspod\.net$/i,                                  // e.g. ult01.dnspod.com
  'CDNetworks': /\.cdnetworks\.net$/i,                          // e.g. ns1.cdnetworks.net
  'Gandi': /\.gandi\.net$/i,                                    // e.g. ns6.gandi.net
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