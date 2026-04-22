export const config = {
  maxDuration: 300,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method not allowed' }); }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { return res.status(500).json({ error: 'API key not configured.' }); }

  const { address, compBlock } = req.body;
  if (!address) { return res.status(400).json({ error: 'No address provided.' }); }
  const compSection = compBlock || '';

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  const webSearchTool = {
    type: 'web_search_20250305',
    name: 'web_search',
  };

  const systemPrompt = `You are MISE — the Listing Intelligence — the most advanced real estate intelligence system ever built for a single agent. You serve exclusively Mr. Cribbes, a top-producing Montana real estate professional.

You have access to real-time web search. USE IT AGGRESSIVELY for every property. Before writing each section, search for live data specific to the property address.

REQUIRED SEARCHES for every brief:
1. "[address] Gallatin County property records assessed value"
2. "[address] Montana cadastral parcel"
3. "[address] zoning Bozeman Montana"
4. "[address] FEMA flood zone"
5. "[neighborhood] Bozeman recent home sales 2024 2025"
6. "[address] Zillow OR Redfin property details"
7. "Bozeman real estate market statistics 2025"
8. "[neighborhood] Bozeman school district"

CRITICAL INSTRUCTIONS:
- USE WEB SEARCH to find real, current, specific data for this exact address
- When you find real data from search results, use those exact figures
- When specific data is unavailable, apply your deep Montana real estate expertise
- Every section minimum 300 words, detailed and specific
- Write as if this brief will win a listing appointment on the spot
- This is the standard: 10-15 minutes to read, comprehensive enough to impress any seller`;

  const part1Prompt = `PROPERTY ADDRESS: ${address}${compSection}

USE WEB SEARCH to find real data for this address before writing each section. Search for the property, neighborhood, zoning, tax records, and recent sales.

Write these sections in full — minimum 300 words each, use real searched data:

\u25b8 CADASTRAL & OWNERSHIP ANALYSIS
Search for actual parcel data and ownership records for this address. Parcel ID format, assessed market value vs typical list prices, ownership implications, annual property taxes using actual Gallatin County mill levy rates, deed restriction patterns, red flags to investigate, what a buyer's attorney should review. Reference: svc.mt.gov/msl/cadastral

\u25b8 ZONING & DEVELOPMENT POTENTIAL
Search for the actual zoning designation for this address. All permitted uses by-right and conditional uses requiring CUP. Full ADU analysis under BMC 38.360.040. STR regulations and revenue potential. Development potential. Setbacks, height limits, lot coverage. Overlay districts. Growth Policy designation. Highest and best use conclusion. Reference: gisweb.bozeman.net/Html5Viewer/?viewer=planning

\u25b8 TAX & FINANCIAL ANALYSIS
Search for actual tax records for this property. Taxable value, annual taxes broken down by county/city/school/special districts. Likely SID or LID assessments. Effective tax rate vs Bozeman market average. Tax trajectory analysis. Tax advantage strategies. Reference: mtrevenue.gov/property

\u25b8 FLOOD, HAZARD & ENVIRONMENTAL
Search for actual FEMA flood zone for this address. Wildfire WUI designation. Montana radon risk. Water rights analysis. Soil and geologic considerations. Environmental history. How to present these factors to buyers.

\u25b8 PERMIT HISTORY & COMPLIANCE
What permits should exist for this property type and age. Red flags suggesting unpermitted work. Bozeman Building Division records to pull. How to advise seller on proactive permit resolution. Impact on financing. Cost estimates for common permit issues.

\u25b8 MARKET POSITION & COMPETITIVE ANALYSIS
Search for actual recent sales in this neighborhood. Bozeman market overview: inventory levels, DOM trends, list-to-sale ratios, price per SF benchmarks, seasonal patterns. Competitive positioning, pricing strategy, absorption analysis. How to differentiate from competition.

\u25b8 NEIGHBORHOOD DEMOGRAPHIC INTELLIGENCE
Search for actual demographic data for this neighborhood and zip code. Population profile, economic profile, migration patterns, cultural and lifestyle profile. What this means for marketing strategy.

\u25b8 IDEAL BUYER PROFILES — DEEP PSYCHOLOGICAL ANALYSIS
Top 3 buyer personas based on actual neighborhood demographics. For each: persona name, demographics, origin, financial profile, core values, biggest fears, decision trigger, media diet, resonant messaging, reach strategy, conversion probability, negotiation profile.

\u25b8 LIFESTYLE ANALYSIS — THE FULL MONTANA EXPERIENCE
Search for specific businesses, trails, and amenities near this address. Morning ritual with specific nearby coffee spots. Actual commute times to downtown Bozeman/MSU/Bozeman Health/Bridger Bowl/Belgrade/Livingston. Weekend warrior activities. Community character. Honest seasonal reality check.

\u25b8 SCHOOLS & FAMILY INFRASTRUCTURE
Search for the actual assigned schools for this address. Elementary/middle/high school with context on Bozeman School District quality. Specific programs, private options, MSU proximity, childcare reality, family infrastructure. How to use schools as a marketing asset.`;

  const part2Prompt = `PROPERTY ADDRESS: ${address}

Continue the MISE Intelligence Brief. Use web search for current data where helpful. Each section minimum 300 words:

\u25b8 LOCATION INTELLIGENCE
Walk score assessment. Drive time matrix: downtown Bozeman, BZN airport, MSU, Bridger Bowl, Big Sky, Costco, Bozeman Health, Belgrade, Livingston, Yellowstone North Entrance. Essential services within 5 minutes. Dining and entertainment within 15 minutes with specific restaurant and bar names. Negative proximity factors to address proactively.

\u25b8 HONEST CONS ANALYSIS
Every realistic negative by category: property-specific, location, market, neighborhood, Montana-specific, financial. For each: likelihood a buyer raises it (High/Medium/Low) and deal-impact (Deal-killer/Negotiating chip/Minor concern).

\u25b8 OBJECTION HANDLER PLAYBOOK
For every con: OBJECTION (exact buyer words), UNDERLYING FEAR, ACKNOWLEDGE, REFRAME (with data), REDIRECT, CLOSE FORWARD, LEAVE-BEHIND DATA. Write as actual scripts Mr. Cribbes can memorize and deliver naturally.

\u25b8 LISTING HEADLINE ARSENAL
12 distinct headlines: 3 lifestyle, 2 investment/value, 2 aspiration, 2 urgency, 2 feature-specific, 1 community. Each with platform recommendation and target persona.

\u25b8 LISTING COPY SUITE
Full MLS description (300-350 words): opening hook, property highlights, location/lifestyle, practical details, closing CTA. Social media caption (150 words, luxury tone, no emojis). Text message version (50 words). Voicemail script (30 seconds).

\u25b8 EMAIL CAMPAIGN — 3-PART SEQUENCE
Email 1 THE DISCOVERY (launch day): 5 subject lines, preview text, full body 250-350 words, P.S. line.
Email 2 THE DEEP DIVE (days 4-5): 5 subject lines, preview text, full body 200-300 words, P.S. line.
Email 3 THE LAST CALL (48 hours before deadline): 5 subject lines, preview text, full body 150-200 words, P.S. line.

\u25b8 SOCIAL MEDIA CONTENT MACHINE
Instagram: 10-frame carousel with captions, 30-45 second Reel script, 7-frame Story sequence. Facebook: 400-word launch post, neighborhood spotlight. LinkedIn: investment angle post. TikTok: 60-second script with hook and CTA. 30 targeted hashtags by category.

\u25b8 OPEN HOUSE STRATEGY
Pre-event 7 days out: neighbor invitation script, agent outreach email, social timeline, signage strategy. Setup and atmosphere. During event: greeter script, 5 qualifying questions, room-by-room tour story. Post-event: 2-hour text, 24-hour email, Day 3 call script.

\u25b8 MAXIMUM OFFER STRATEGY
Pre-market campaign, teaser strategy, Coming Soon MLS strategy. Offer structure: review date psychology, competitive tension, escalation clause guidance. Multiple offer management. Perfect offer profile. Fallback strategy.

\u25b8 90-DAY FARMING MASTER PLAN
Farm definition, database build, 5-touch sequence with complete scripts: Just Listed mailer, Door knock script, Market update mailer, Referral ask, Just Sold announcement. Digital farming: Facebook groups, Nextdoor, Instagram geo-targeting.

\u25b8 LOAN PROGRAM INTELLIGENCE
Search for current Montana Housing programs and mortgage rates. Conforming vs jumbo analysis. FHA/VA/USDA eligibility. DSCR loan analysis with rent estimate. Montana Housing MBOH programs. 2-1 buydown math. Co-marketing strategy with loan officer.

\u25b8 EXECUTIVE SUMMARY — THE BRIEF WITHIN THE BRIEF
The property's story in 2-3 paragraphs. Top 5 selling points with proof and exact language. Top 3 risks with mitigation steps. Pricing recommendation: three scenarios (aggressive/market/conservative) with predicted outcomes. 30-day launch checklist. One-sentence listing thesis. Competitive advantage statement: why Mr. Cribbes and MISE give this seller an unfair advantage over every other agent.`;

  async function runWithSearch(prompt) {
    const messages = [{ role: 'user', content: prompt }];
    let finalText = '';
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: systemPrompt,
          tools: [webSearchTool],
          messages,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'API error ' + response.status);

      if (Array.isArray(data.content)) {
        for (const block of data.content) {
          if (block.type === 'text') finalText += block.text;
        }
      }

      const toolUseBlocks = Array.isArray(data.content)
        ? data.content.filter(b => b.type === 'tool_use')
        : [];

      if (toolUseBlocks.length === 0 || data.stop_reason === 'end_turn') break;

      messages.push({ role: 'assistant', content: data.content });

      const toolResults = toolUseBlocks.map(b => ({
        type: 'tool_result',
        tool_use_id: b.id,
        content: 'Search completed for: ' + (b.input && b.input.query ? b.input.query : 'query'),
      }));

      messages.push({ role: 'user', content: toolResults });
    }

    return finalText;
  }

  try {
    const [text1, text2] = await Promise.all([
      runWithSearch(part1Prompt),
      runWithSearch(part2Prompt),
    ]);

    const combined = text1 + '\n\n' + text2;

    if (!combined.trim()) {
      return res.status(500).json({ error: 'Empty response from API' });
    }

    return res.status(200).json({
      content: [{ type: 'text', text: combined }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
