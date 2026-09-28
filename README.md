# SiteSignal

**Your AI-assisted SEO intelligence co-pilot for technical audits, topic discovery, and content workflows.**

SiteSignal combines lightweight site crawling, data-driven on-page diagnostics, and search-led topic discovery in one streamlined workspace. Turn autocomplete signals into prioritized opportunities, enrich research with optional search results, and use Gemini for context-aware content drafts. A human-in-the-loop workflow keeps editorial judgment and fact-checking where they belong: with you.

## What It Can Do

- Crawl up to 30 pages on the submitted domain.
- Audit page titles, meta descriptions, headings, canonical tags, language, image alt text, and links.
- Flag duplicate titles and descriptions, and inspect `robots.txt` and sitemaps.
- Discover topics with Google Autocomplete, then apply heuristic search-intent classification and opportunity scoring.
- Enrich discovery with optional Google Custom Search research.
- Generate Gemini-assisted content briefs and drafts, including an outline, FAQ, and context-aware internal-link suggestions from crawled pages.
- Keep a human-in-the-loop review process: AI output is a starting point, not a substitute for editorial review or source verification.

## Skills in Action

SiteSignal brings together practical SEO and AI workflows across:

- **Technical SEO:** crawlability signals, page structure, metadata, canonical tags, and sitemap checks.
- **On-page analysis:** titles, descriptions, headings, image accessibility, and internal links.
- **Keyword and topic discovery:** autocomplete-based idea generation and search-intent classification.
- **Content intelligence:** opportunity prioritization and content-gap exploration.
- **Generative AI:** Gemini-powered, research-aware drafting with explicit fact-checking guidance.
- **Prompt engineering:** structured instructions for useful outlines, FAQs, articles, and internal-link suggestions.
- **Human-in-the-loop AI:** editorial review and verification remain part of the workflow.
- **Web development:** a lightweight Node.js and Express application, HTML parsing, and HTTP-based crawling.

## Built With

Node.js, Express, Axios, Cheerio, and vanilla HTML/CSS/JavaScript.

## Run Locally

**Requirements:** Node.js 20 or later.

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

Create a `.env` file in the project root to enable integrations:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CSE_KEY=your_google_custom_search_key
GOOGLE_CSE_ID=your_programmable_search_engine_id
```

Gemini is used for content generation. Google Custom Search is optional and adds search-result research. Leave either integration unconfigured to use the features that do not depend on it. Keep API keys private and do not commit `.env`.

## How to Use

1. Start the app and enter a website URL.
2. Review the audit score, page-level findings, and content opportunities.
3. Choose an opportunity to research and generate a draft when the relevant integrations are configured.
4. Verify claims and current facts before using generated content.

## Notes and Limitations

SiteSignal is an MVP and makes no claim to provide Google search volume, ranking probabilities, or guaranteed SEO results. Opportunity scores and intent labels are heuristic estimates. Autocomplete suggestions and search snippets are discovery leads, not authoritative sources. Generated content is a draft and should be fact-checked and edited before publication.