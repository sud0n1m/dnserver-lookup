This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Shared DNS Provider Detection

This project uses a shared file, `dns_providers.json`, located at the project root, to define DNS provider detection patterns. This file contains a list of provider names and regular expressions used to identify DNS providers from nameserver records.

- **Location:** `dns_providers.json` (project root, next to `package.json`)
- **Format:** JSON array of objects, each with `provider` and `regex` fields.
- **Usage:**
  - The **Next.js API** (`app/api/analyze-domains/route.ts`) loads and caches this file to detect providers for incoming requests.
  - The **Python bulk processing script** (`bulk_dns_lookup.py`) loads the same file for consistent provider detection in large batch jobs.

### Example Entry
```json
{
  "provider": "Cloudflare",
  "regex": ".*(ns[0-9]+\.)?cloudflare\\.com$"
}
```

### Updating Providers
To add or update a provider, edit `dns_providers.json`. Changes will be picked up automatically by both the API and the Python script (restart the dev server or rerun the script if needed).

## Bulk DNS Lookup with Python

For processing very large lists of domains (up to hundreds of thousands), use the provided Python script:

### 1. Install Dependencies
This script requires Python 3 and the `dnspython` package:

```bash
pip install dnspython
```

### 2. Prepare Your Input File
Create a text file (e.g., `input_domains.txt`) with one domain per line:
```
example.com
anotherdomain.org
...
```

### 3. Run the Script
From the project root, run:

```bash
python bulk_dns_lookup.py input_domains.txt output.csv
```
- Replace `input_domains.txt` with your input file.
- The results will be written to `output.csv`.

### 4. Output
The output CSV will have columns:
- Domain
- Uses Cloudflare (Yes/No)
- Guessed Provider
- DNS Response/Error

The script uses the same `dns_providers.json` file as the Next.js app for consistent provider detection.
