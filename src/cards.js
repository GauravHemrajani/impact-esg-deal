// 30-card ESG Deck - ACCURATE TO PDF SPEC
// Assets: 12 cards | Action: 12 cards | Capital: 6 cards

export const CARD_TYPES = {
  ASSET: "Asset",
  ACTION: "Action",
  CAPITAL: "Capital",
};

export const CATEGORIES = {
  E: "Environment",
  S: "Social",
  G: "Governance",
  WILD: "Wild",
  NEUTRAL: "Neutral",
};

export const DECK = [
  // === ASSETS (12 Cards) ===
  { id: 1, name: "Solar Array", type: CARD_TYPES.ASSET, category: CATEGORIES.E, value: 2, set: "RenewableEnergy", lesson: "Renewable energy reduces Scope 2 emissions" },
  { id: 2, name: "Waste Recovery Unit", type: CARD_TYPES.ASSET, category: CATEGORIES.E, value: 2, set: "CircularEconomy", lesson: "Circular economy principles reduce waste" },
  { id: 3, name: "Reforestation Project", type: CARD_TYPES.ASSET, category: CATEGORIES.E, value: 1, set: "NatureBased", lesson: "Nature-based solutions for carbon capture" },
  
  { id: 4, name: "Diversity Board", type: CARD_TYPES.ASSET, category: CATEGORIES.S, value: 3, set: "InclusiveLeadership", lesson: "Diverse leadership improves decision-making" },
  { id: 5, name: "Fair Wage Factory", type: CARD_TYPES.ASSET, category: CATEGORIES.S, value: 3, set: "EthicalLabor", lesson: "Ethical labor practices reduce turnover and risk" },
  { id: 6, name: "Community Health Clinic", type: CARD_TYPES.ASSET, category: CATEGORIES.S, value: 1, set: "CSR", lesson: "Corporate Social Responsibility builds trust" },
  
  { id: 7, name: "Whistleblower Policy", type: CARD_TYPES.ASSET, category: CATEGORIES.G, value: 4, set: "Transparency", lesson: "Transparency mechanisms prevent corruption" },
  { id: 8, name: "Data Privacy Vault", type: CARD_TYPES.ASSET, category: CATEGORIES.G, value: 4, set: "DataGovernance", lesson: "Protecting stakeholder data is a governance duty" },
  { id: 9, name: "Anti-Bribery Protocol", type: CARD_TYPES.ASSET, category: CATEGORIES.G, value: 2, set: "Compliance", lesson: "Zero-tolerance for corruption ensures compliance" },
  
  { id: 10, name: "Greenwashing Asset", type: CARD_TYPES.ASSET, category: CATEGORIES.WILD, value: 0, set: "ANY", lesson: "Faking compliance works until you get caught" },
  { id: 11, name: "Greenwashing Asset", type: CARD_TYPES.ASSET, category: CATEGORIES.WILD, value: 0, set: "ANY", lesson: "Faking compliance works until you get caught" },
  { id: 12, name: "Impact Unicorn", type: CARD_TYPES.ASSET, category: CATEGORIES.WILD, value: 5, set: "ANY", lesson: "A truly perfect sustainable asset (very rare)" },

  // === ACTION CARDS (12 Cards) ===
  { id: 13, name: "Regulatory Fine", type: CARD_TYPES.ACTION, effect: "fine", amount: 5, lesson: "Non-compliance is expensive" },
  { id: 14, name: "Hostile Takeover", type: CARD_TYPES.ACTION, effect: "steal-set", lesson: "Weak governance makes you vulnerable to acquisition" },
  { id: 15, name: "External Audit", type: CARD_TYPES.ACTION, effect: "destroy-greenwashing", lesson: "Transparency exposes false claims" },
  { id: 16, name: "Sustainability Report", type: CARD_TYPES.ACTION, effect: "collect-all", amount: 2, lesson: "Publishing good reports attracts investment" },
  { id: 17, name: "Stakeholder Revolt", type: CARD_TYPES.ACTION, effect: "swap-asset", lesson: "Ignoring stakeholders leads to loss of control" },
  { id: 18, name: "Compliance Check", type: CARD_TYPES.ACTION, effect: "block", lesson: "Strong internal controls prevent external damage" },
  { id: 19, name: "Carbon Credit", type: CARD_TYPES.ACTION, effect: "block-e-attack", lesson: "Offsets can mitigate environmental risks" },
  { id: 20, name: "Supply Chain Disrupt", type: CARD_TYPES.ACTION, effect: "discard-asset", lesson: "Unstable supply chains lead to operational failure" },
  { id: 21, name: "Regulatory Fine", type: CARD_TYPES.ACTION, effect: "fine", amount: 5, lesson: "Non-compliance is expensive" },
  { id: 22, name: "Policy Change", type: CARD_TYPES.ACTION, effect: "pass-left", lesson: "Regulations change quickly; you must adapt" },
  { id: 23, name: "Grant Funding", type: CARD_TYPES.ACTION, effect: "draw-2", lesson: "Sustainable projects attract unique funding sources" },
  { id: 24, name: "Policy Change", type: CARD_TYPES.ACTION, effect: "pass-left", lesson: "Regulations change quickly; you must adapt" },

  // === CAPITAL CARDS (6 Cards) ===
  { id: 25, name: "Green Bond", type: CARD_TYPES.CAPITAL, value: 10 },
  { id: 26, name: "Impact Investment", type: CARD_TYPES.CAPITAL, value: 5 },
  { id: 27, name: "Impact Investment", type: CARD_TYPES.CAPITAL, value: 5 },
  { id: 28, name: "Government Subsidy", type: CARD_TYPES.CAPITAL, value: 3 },
  { id: 29, name: "Government Subsidy", type: CARD_TYPES.CAPITAL, value: 3 },
  { id: 30, name: "Micro-Loan", type: CARD_TYPES.CAPITAL, value: 1 },
];

// Shuffle function using Fisher-Yates algorithm
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
