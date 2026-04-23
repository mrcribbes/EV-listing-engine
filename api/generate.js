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

  // ── STEP 1: Focused research call — search only, no writing ──
  // Cap at 4 searches, 1500 tokens max, returns a tight data block
  async function gatherResearch(address) {
    const researchPrompt = `Research this Montana property and return ONLY a compact data summary — no prose, no sections, just facts.

PROPERTY: ${address}

Run these 4 searches and summarize what you find in under 400 words total:
1. "${address} property Gallatin County assessed value zoning"
2. "${address} Zillow OR Redfin"
3. "${address} FEMA flood zone Montana"
4. "[neighborhood from address] Bozeman recent sales 2024 2025 median price"

Return ONLY this structured format:
PARCEL: [id if found, else unknown]
ASSESSED VALUE: [if found]
OWNER: [if found]
ZONING: [if found]
FLOOD ZONE: [if found]
RECENT SALES: [2-3 recent nearby sales with price and date if found]
ZILLOW DATA: [list price, tax history, beds/baths/sqft if found]
SCHOOLS: [assigned schools if found]
MARKET: [any current market stats found]
NOT FOUND: [list anything not found]`;

    const messages = [{ role: 'user', content: researchPrompt }];
    let researchData = '';
    let iterations = 0;

    while (iterations < 5) {
      iterations++;
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          tools: [webSearchTool],
          messages,
        }),
      });

      const data = await response.json();
      if (!response.ok) break;

      if (Array.isArray(data.content)) {
        for (const block of data.content) {
          if (block.type === 'text') researchData += block.text;
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

    return researchData || 'No live data found — use Montana expertise.';
  }

  const systemPrompt = `You are MISE — the Listing Intelligence — the most advanced real estate intelligence system ever built for a single agent, serving exclusively Mr. Cribbes at Engel & Völkers Bozeman.

You are:
1. A Montana real estate data analyst with encyclopedic knowledge of Gallatin County zoning, cadastral systems, tax methodology, and development regulations
2. A top-producing Bozeman listing agent who knows exactly what wins listings and generates multiple offers
3. An elite copywriter who makes buyers feel before they think
4. A demographic analyst and digital marketing strategist

CRITICAL:
- Write with absolute authority. Every section minimum 300 words, specific and detailed.
- Use the LIVE RESEARCH DATA provided at the top of each prompt — those are real facts from web searches
- Where live data is missing, apply your deep Montana real estate expertise
- This brief must be impressive enough to win a listing appointment on the spot`;

  const part1Prompt = (address, research, compSection) =>
`LIVE RESEARCH DATA (from real-time web searches — use these facts):
${research}
${compSection}

PROPERTY ADDRESS: ${address}

Write these sections. Each minimum 300 words. Use live research data above where available:

\u25b8 CADASTRAL & OWNERSHIP ANALYSIS
Use any parcel/assessed value/owner data from research above. Cover: parcel ID, assessed value vs market value, ownership implications, property taxes using Gallatin County mill levy rates (~450-500 mills city, ~350-400 county), deed restrictions, red flags to investigate, what a buyer's attorney reviews. Reference: svc.mt.gov/msl/cadastral

\u25b8 ZONING & DEVELOPMENT POTENTIAL
Use zoning data from research. Cover: zoning designation and implications, all permitted by-right uses, CUP requirements, ADU analysis under BMC 38.360.040, STR regulations and revenue potential, development possibilities, setbacks, height limits, lot coverage, overlay districts, Growth Policy designation, highest and best use. Reference: gisweb.bozeman.net

\u25b8 TAX & FINANCIAL ANALYSIS
Use assessed value and tax data from research. Cover: taxable value, annual tax breakdown by county/city/school/special districts, SID/LID assessments, effective tax rate vs Bozeman average, tax trajectory, tax advantage strategies. Reference: mtrevenue.gov/property

\u25b8 FLOOD, HAZARD & ENVIRONMENTAL
Use flood zone data from research. Cover: FEMA flood zone classification, wildfire WUI designation, Montana radon risk, water rights analysis, soil and geologic considerations, environmental history, how to present to buyers.

\u25b8 PERMIT HISTORY & COMPLIANCE
Cover: what permits should exist for this property type and age, red flags for unpermitted work, Bozeman Building Division records to pull, how to advise seller on permit resolution, financing impact, cost estimates.

\u25b8 MARKET POSITION & COMPETITIVE ANALYSIS
Use recent sales and market data from research. Cover: Bozeman market overview — inventory, DOM, list-to-sale ratios, price per SF benchmarks, seasonal patterns. Competitive positioning: price per SF recommendation, top 3 value drivers, top 3 value detractors, pricing strategy, absorption analysis, differentiation.

\u25b8 NEIGHBORHOOD DEMOGRAPHIC INTELLIGENCE
Cover: population profile — median income, age distribution, education, household composition, owner vs renter rate. Economic profile — top employers, remote worker %, entrepreneurial %. Migration patterns, cultural profile, what this means for marketing.

\u25b8 IDEAL BUYER PROFILES — DEEP PSYCHOLOGICAL ANALYSIS
Top 3 buyer personas. For each: persona name, demographics, origin, financial profile, core values, biggest fears, decision trigger, media diet, resonant messaging, reach strategy, conversion probability, negotiation profile.

\u25b8 LIFESTYLE ANALYSIS — THE FULL MONTANA EXPERIENCE
Specific nearby coffee shops, fitness, commute times to downtown Bozeman/MSU/Bozeman Health/Bridger Bowl/Belgrade/Livingston. Weekend hikes, fishing, skiing. Community character. Honest seasonal reality.

\u25b8 SCHOOLS & FAMILY INFRASTRUCTURE
Use school data from research. Assigned elementary/middle/high school, district quality, specific programs, private options, MSU proximity, childcare reality, how to use schools as marketing asset.`;

  const part2Prompt = (address) =>
`PROPERTY ADDRESS: ${address}

Continue the MISE Intelligence Brief. Each section minimum 300 words:

\u25b8 LOCATION INTELLIGENCE
Walk score. Drive time matrix: downtown Bozeman, BZN airport, MSU, Bridger Bowl, Big Sky, Costco, Bozeman Health, Belgrade, Livingston, Yellowstone North Entrance. Services within 5 min. Dining/entertainment within 15 min with specific restaurant names. Negative proximity factors.

\u25b8 HONEST CONS ANALYSIS
Every realistic negative by category: property-specific, location, market, neighborhood, Montana-specific, financial. For each: likelihood buyer raises it (High/Medium/Low) and deal-impact (Deal-killer/Negotiating chip/Minor concern).

\u25b8 OBJECTION HANDLER PLAYBOOK
For every con: OBJECTION, UNDERLYING FEAR, ACKNOWLEDGE, REFRAME with data, REDIRECT, CLOSE FORWARD, LEAVE-BEHIND DATA. Full scripts Mr. Cribbes can memorize.

\u25b8 LISTING HEADLINE ARSENAL
12 headlines: 3 lifestyle, 2 investment/value, 2 aspiration, 2 urgency, 2 feature-specific, 1 community. Each with platform and target persona.

\u25b8 LISTING COPY SUITE
MLS description 300-350 words. Social media caption 150 words luxury tone. Text message 50 words. Voicemail script 30 seconds.

\u25b8 EMAIL CAMPAIGN — 3-PART SEQUENCE
Email 1 THE DISCOVERY: 5 subject lines, preview text, 250-350 word body, P.S.
Email 2 THE DEEP DIVE: 5 subject lines, preview text, 200-300 word body, P.S.
Email 3 THE LAST CALL: 5 subject lines, preview text, 150-200 word body, P.S.

\u25b8 SOCIAL MEDIA CONTENT MACHINE
Instagram: 10-frame carousel with captions, Reel script, Story sequence. Facebook: launch post, neighborhood spotlight. LinkedIn: investment angle. TikTok: 60-second script. 30 hashtags by category.

\u25b8 OPEN HOUSE STRATEGY
Pre-event scripts and timeline. Setup and atmosphere. During: greeter script, qualifying questions, room-by-room story. Post-event: 2-hour text, 24-hour email, Day 3 call script.

\u25b8 MAXIMUM OFFER STRATEGY
Pre-market campaign, teaser strategy, Coming Soon approach. Offer structure, competitive tension, escalation guidance. Multiple offer management. Perfect offer profile. Fallback plan.

\u25b8 90-DAY FARMING MASTER PLAN
Farm definition, database build, 5-touch sequence with full scripts: Just Listed mailer, door knock script, market update mailer, referral ask, Just Sold announcement. Digital farming strategy.

\u25b8 LOAN PROGRAM INTELLIGENCE
Conforming vs jumbo analysis. FHA/VA/USDA eligibility. DSCR analysis with rent estimate. Montana Housing MBOH programs. 2-1 buydown math with real numbers. Co-marketing strategy with loan officer.

\u25b8 EXECUTIVE SUMMARY — THE BRIEF WITHIN THE BRIEF
Property story in 2-3 paragraphs. Top 5 selling points with proof and exact language. Top 3 risks with mitigation. Pricing: three scenarios (aggressive/market/conservative) with predicted outcomes. 30-day launch checklist. One-sentence listing thesis. Competitive advantage statement: why Mr. Cribbes and MISE give this seller an unfair advantage over every other agent.`;

  try {
    // Step 1: gather research (one focused call with search)
    const research = await gatherResearch(address);

    // Step 2: run both writing calls in parallel — no search, just writing
    const [text1, text2] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: systemPrompt,
          messages: [{ role: 'user', content: part1Prompt(address, research, compSection) }],
        }),
      }).then(r => r.json()).then(d => {
        if (!d.content) return '';
        return d.content.filter(b => b.type === 'text').map(b => b.text).join('');
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: systemPrompt,
          messages: [{ role: 'user', content: part2Prompt(address) }],
        }),
      }).then(r => r.json()).then(d => {
        if (!d.content) return '';
        return d.content.filter(b => b.type === 'text').map(b => b.text).join('');
      }),
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
