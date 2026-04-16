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

  const { address } = req.body;
  if (!address) { return res.status(400).json({ error: 'No address provided.' }); }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  const systemPrompt = `You are ELA — the Elite Listing Application — the most advanced real estate intelligence system ever built for a single agent. You serve exclusively Mr. Cribbes, a top-producing Montana real estate professional.

You are simultaneously:
1. A Montana real estate data analyst with encyclopedic knowledge of Gallatin County zoning codes, cadastral systems, tax assessment methodology, and development regulations
2. A top-producing Bozeman listing agent who has closed hundreds of transactions
3. An elite copywriter who crafts marketing that makes buyers feel before they think
4. A demographic analyst who can profile a neighborhood's buyer pool from zip code data alone
5. A digital marketing strategist who knows exactly which platforms, hooks, and content formats convert

CRITICAL INSTRUCTIONS:
- Write with absolute authority and confidence. Never say "I cannot access" or "I don't have real-time data"
- Every section must be LONG, DETAILED, and SPECIFIC. Minimum 300 words per section.
- Use specific Montana knowledge: Gallatin County mill levies, Bozeman zoning codes, typical Bozeman market metrics.
- Reference these sources by name: Montana Cadastral (svc.mt.gov/msl/cadastral), Bozeman GIS Planning Viewer (gisweb.bozeman.net/Html5Viewer/?viewer=planning), Montana DNRC Water Rights (gis.dnrc.mt.gov/apps/WRQS), Montana DOR (mtrevenue.gov/property)`;

  const part1Prompt = `PROPERTY ADDRESS: ${address}

Write the following sections in full. Each section must be at minimum 300 words and extremely detailed and specific:

▸ CADASTRAL & OWNERSHIP ANALYSIS
Parcel ID format, assessed market value vs typical list prices, ownership implications, annual property taxes using Gallatin County mill levy rates, deed restriction patterns, red flags to investigate before listing, what a buyer's attorney should review. Reference: svc.mt.gov/msl/cadastral

▸ ZONING & DEVELOPMENT POTENTIAL
Most likely zoning designation and what it means. ALL permitted uses by-right and conditional uses requiring CUP. Full ADU analysis under BMC 38.360.040. STR regulations and revenue potential. Development potential including subdivision possibilities. Setbacks, height limits, lot coverage. Overlay districts. Growth Policy designation. Highest and best use conclusion. Reference: gisweb.bozeman.net/Html5Viewer/?viewer=planning

▸ TAX & FINANCIAL ANALYSIS
Taxable value estimate, annual taxes broken down by county/city/school/special districts. Likely SID or LID assessments. Effective tax rate vs Bozeman market average. Tax trajectory analysis. Tax advantage strategies. Reference: mtrevenue.gov/property

▸ FLOOD, HAZARD & ENVIRONMENTAL
FEMA flood zone analysis. Wildfire WUI designation. Montana radon risk. Water rights analysis (gis.dnrc.mt.gov/apps/WRQS). Soil and geologic considerations. Environmental history. How to present these factors to buyers.

▸ PERMIT HISTORY & COMPLIANCE
What permits should exist for this property type and age. Red flags suggesting unpermitted work. Bozeman Building Division records to pull. How to advise seller on proactive permit resolution. Impact on financing. Cost estimates for common permit issues.

▸ MARKET POSITION & COMPETITIVE ANALYSIS
Bozeman market overview: inventory levels, DOM trends, list-to-sale ratios, price per SF benchmarks, seasonal patterns. Competitive positioning: price per SF this property should command and why, top 3 value drivers, top 3 value detractors, pricing strategy recommendation. Absorption analysis. How to differentiate from competition.

▸ NEIGHBORHOOD DEMOGRAPHIC INTELLIGENCE
Population profile: median income, age distribution, education, household composition, owner vs renter rate. Economic profile: top employers, remote worker percentage, entrepreneurial percentage. Migration patterns. Cultural and lifestyle profile. What this means for marketing strategy.

▸ IDEAL BUYER PROFILES — DEEP PSYCHOLOGICAL ANALYSIS
Top 3 buyer personas. For each: persona name and archetype, demographics, origin, financial profile, core values, biggest fears, decision trigger, media diet, resonant messaging, reach strategy, conversion probability, negotiation profile.

▸ LIFESTYLE ANALYSIS — THE FULL MONTANA EXPERIENCE
Morning ritual: specific coffee spots, workout options, sunrise description. Weekday life: commute times to downtown Bozeman/MSU/Bozeman Health/Bridger Bowl/Belgrade/Livingston, work-from-home quality, after-work routine. Weekend warrior: specific summer hikes with names and drive times, fishing holes, winter skiing at Bridger Bowl and Big Sky. Community character. Hidden gem angle. Honest seasonal reality check.

▸ SCHOOLS & FAMILY INFRASTRUCTURE
Assigned elementary/middle/high school with context. Specific programs: AP, dual enrollment with MSU, arts, athletics. Private and alternative options. MSU proximity. Childcare reality. Family infrastructure. How to use schools as a marketing asset.`;

  const part2Prompt = `PROPERTY ADDRESS: ${address}

Continue the ELA Intelligence Brief. Write the following sections in full. Each section must be at minimum 300 words and extremely detailed and specific:

▸ LOCATION INTELLIGENCE
Realistic walk score assessment. Drive time matrix: downtown Bozeman, BZN airport, MSU, Bridger Bowl, Big Sky, Costco/major grocery, Bozeman Health, Belgrade, Livingston, Yellowstone North Entrance. Essential services within 5 minutes. Dining and entertainment within 15 minutes with specific Bozeman restaurant and bar names. Negative proximity factors to address proactively.

▸ HONEST CONS ANALYSIS
Every realistic negative organized by category: property-specific, location, market, neighborhood, Montana-specific, financial. For each: likelihood a buyer raises it (High/Medium/Low) and deal-impact (Deal-killer/Negotiating chip/Minor concern).

▸ OBJECTION HANDLER PLAYBOOK
For every con identified: OBJECTION (exact words a buyer would say), UNDERLYING FEAR, ACKNOWLEDGE, REFRAME (with data), REDIRECT, CLOSE FORWARD, LEAVE-BEHIND DATA. Write as actual scripts Mr. Cribbes can memorize and deliver naturally.

▸ LISTING HEADLINE ARSENAL
12 distinct headlines organized by angle: 3 lifestyle, 2 investment/value, 2 aspiration, 2 urgency, 2 feature-specific, 1 community. Each with platform recommendation and target persona.

▸ LISTING COPY SUITE
Full MLS description (300-350 words): opening hook, property highlights, location/lifestyle paragraph, practical details, closing CTA. Social media caption (150 words, luxury brand tone, no emojis). Text message version (50 words). Voicemail script (30 seconds).

▸ EMAIL CAMPAIGN — 3-PART SEQUENCE
Email 1 THE DISCOVERY (launch day): 5 subject line options, preview text, full body 250-350 words, P.S. line.
Email 2 THE DEEP DIVE (days 4-5): 5 subject line options, preview text, full body 200-300 words, P.S. line.
Email 3 THE LAST CALL (48 hours before deadline): 5 subject line options, preview text, full body 150-200 words, P.S. line.

▸ SOCIAL MEDIA CONTENT MACHINE
Instagram: 10-frame carousel breakdown with captions for each frame, 30-45 second Reel script, 7-frame Story sequence. Facebook: 400-word launch post, neighborhood spotlight post. LinkedIn: professional/investment angle post. TikTok: 60-second script with hook and CTA. 30 targeted hashtags organized by category.

▸ OPEN HOUSE STRATEGY
Pre-event 7 days out: neighbor invitation script, agent outreach email, social timeline, signage strategy. Setup and atmosphere: arrival experience, music, scent, temperature, lighting, printed materials. During event: greeter script, 5 qualifying questions, room-by-room tour story. Post-event follow-up: 2-hour text template, 24-hour email template, Day 3 call script.

▸ MAXIMUM OFFER STRATEGY
Pre-market campaign: who to call first, teaser strategy, Coming Soon MLS strategy, building a waiting list. Offer structure: review date psychology, agent communication, competitive tension, escalation clause guidance. Multiple offer management. Perfect offer profile. Fallback strategy with day-by-day response plan.

▸ 90-DAY FARMING MASTER PLAN
Farm definition: primary streets and boundaries, home count. Database build: sources, tools, 30-day target. 5-touch sequence with complete scripts: Just Listed mailer (full copy), Door knock script (full conversation for every scenario including "I'm thinking of selling"), Market update mailer, Referral ask email, Just Sold announcement. Digital farming: Facebook groups, Nextdoor, Instagram geo-targeting. Long-game conversion system.

▸ LOAN PROGRAM INTELLIGENCE
Conforming vs jumbo analysis for this price point. FHA/VA/USDA eligibility. DSCR loan analysis with rent estimate. Montana Housing MBOH programs. 2-1 buydown math with specific numbers. Closing cost credit analysis. Co-marketing strategy with loan officer.

▸ EXECUTIVE SUMMARY — THE BRIEF WITHIN THE BRIEF
The property's story in 2-3 paragraphs of prose. Top 5 selling points each with proof and exact language to use. Top 3 risks with probability and specific mitigation steps. Pricing recommendation with three scenarios (aggressive/market/conservative) and predicted outcomes for each. 30-day launch action checklist. The one-sentence listing thesis. The competitive advantage statement: why Mr. Cribbes and ELA give this seller an unfair advantage over every other agent.`;

  try {
    // Run both API calls in parallel
    const [res1, res2] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: systemPrompt,
          messages: [{ role: 'user', content: part1Prompt }],
        }),
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 8000,
          system: systemPrompt,
          messages: [{ role: 'user', content: part2Prompt }],
        }),
      }),
    ]);

    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

    if (!res1.ok) return res.status(res1.status).json(data1);
    if (!res2.ok) return res.status(res2.status).json(data2);

    let text1 = '', text2 = '';
    if (Array.isArray(data1.content)) for (const b of data1.content) { if (b.type === 'text') text1 += b.text; }
    if (Array.isArray(data2.content)) for (const b of data2.content) { if (b.type === 'text') text2 += b.text; }

    const combined = text1 + '\n\n' + text2;

    return res.status(200).json({
      content: [{ type: 'text', text: combined }]
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
