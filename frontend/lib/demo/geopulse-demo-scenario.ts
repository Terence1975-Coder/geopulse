export type DemoSignal = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceType: string;
  region: string;
  clusterTag: string;
  kind: "risk" | "opportunity";
  severity: "low" | "medium" | "high";
  confidence: number;
  strength: number;
  relativeTime: string;
  lifecycle: "Fresh" | "Watch" | "Aging";
};

export type DemoStrategicPath = {
  id: string;
  name: string;
  approach: string;
  whereItWins: string;
  risks: string[];
  requirements: string[];
  recommended: boolean;
};

export type DemoExecutionPhase = {
  phase: string;
  owner: string;
  timing: string;
  actions: string[];
};

export type DemoScenario = {
  key: string;
  label: string;
  description: string;
  company: {
    name: string;
    sector: string;
    markets: string[];
    strategicPriorities: string[];
    riskTolerance: string;
    recommendationStyle: string;
  };
  summary: {
    overallRiskScore: number;
    opportunityScore: number;
    posture: string;
    opportunityPosture: string;
    urgency: string;
    confidence: number;
    horizon: string;
    executiveSummary: string;
  };
  signals: DemoSignal[];
  chain: {
    input: string;
    situationOverview: string;
    keyDrivers: string[];
    whatThisMeans: string[];
    recommendedActions: string[];
    selectedPathRationale: string;
    supportingSignals: string[];
    strategicPaths: DemoStrategicPath[];
    executionPhases: DemoExecutionPhase[];
  };
  planner: {
    dependencies: string[];
    risks: string[];
    successMeasures: string[];
    reviewCheckpoints: string[];
  };
};

export const demoScenarios: Record<string, DemoScenario> = {
  automotive: {
    key: "automotive",
    label: "Automotive Retail Resilience",
    description: "Dealer group pressure and aftersales opportunity.",
    company: {
      name: "NorthStar Motor Group",
      sector: "Automotive Retail & Aftersales",
      markets: ["United Kingdom", "Europe"],
      strategicPriorities: [
        "Protect margin",
        "Stabilise used vehicle performance",
        "Grow aftersales resilience",
        "Improve executive visibility",
      ],
      riskTolerance: "balanced",
      recommendationStyle: "boardroom",
    },
    summary: {
      overallRiskScore: 78,
      opportunityScore: 84,
      posture: "Heightened Attention",
      opportunityPosture: "Targeted Upside",
      urgency: "High",
      confidence: 86,
      horizon: "Immediate / 30 Days",
      executiveSummary:
        "GeoPulse is detecting a mixed operating environment for dealer groups: cost pressure and consumer hesitation remain material, but resilience-led service offers, aftersales retention, and faster stock response create a credible near-term commercial upside window.",
    },
    signals: [
      {
        id: "auto-1",
        headline:
          "Freight disruption raises parts and accessory lead-time pressure across UK dealer networks",
        summary:
          "Longer shipping times and higher logistics variability may increase service delays, customer dissatisfaction, and parts planning pressure.",
        source: "Reuters",
        sourceType: "news",
        region: "UK / Europe",
        clusterTag: "Supply Chain / Aftersales",
        kind: "risk",
        severity: "high",
        confidence: 88,
        strength: 84,
        relativeTime: "18 mins ago",
        lifecycle: "Fresh",
      },
      {
        id: "auto-2",
        headline:
          "Vehicle owners keep cars longer, increasing demand for maintenance, warranty and retention offers",
        summary:
          "Extended ownership cycles create stronger aftersales, servicing, retention-plan and loyalty package opportunities for dealer groups.",
        source: "Financial Times",
        sourceType: "news",
        region: "United Kingdom",
        clusterTag: "Aftersales Demand",
        kind: "opportunity",
        severity: "medium",
        confidence: 85,
        strength: 87,
        relativeTime: "42 mins ago",
        lifecycle: "Fresh",
      },
      {
        id: "auto-3",
        headline:
          "Consumer financing sensitivity remains elevated in selected discretionary purchase categories",
        summary:
          "Higher monthly payment sensitivity may slow conversion in price-sensitive segments and increase the importance of value-led positioning.",
        source: "Bloomberg",
        sourceType: "news",
        region: "UK",
        clusterTag: "Demand / Consumer",
        kind: "risk",
        severity: "medium",
        confidence: 82,
        strength: 76,
        relativeTime: "1h ago",
        lifecycle: "Watch",
      },
      {
        id: "auto-4",
        headline:
          "Dealer groups investing in service experience and retention journeys outperform in repeat revenue",
        summary:
          "Improved booking flow, service communication and retention products are correlating with stronger repeat business and margin stability.",
        source: "MarketWatch",
        sourceType: "news",
        region: "Europe",
        clusterTag: "Retention / Experience",
        kind: "opportunity",
        severity: "medium",
        confidence: 79,
        strength: 81,
        relativeTime: "2h ago",
        lifecycle: "Watch",
      },
    ],
    chain: {
      input:
        "Identify the key risks and opportunities affecting this automotive retail group right now, and recommend the strongest immediate path forward.",
      situationOverview:
        "NorthStar Motor Group is operating in a pressured but opportunity-rich environment. Consumer caution and supply volatility are increasing friction, but that same volatility is making aftersales retention, service-led resilience, and faster operational response more commercially valuable.",
      keyDrivers: [
        "Parts and logistics variability is increasing operational pressure in aftersales.",
        "Customers are holding vehicles longer, expanding the maintenance and retention window.",
        "Consumer affordability sensitivity remains high in selected retail segments.",
        "Dealer groups with stronger service experience are preserving repeat revenue more effectively.",
      ],
      whatThisMeans: [
        "Margin protection will depend less on pure vehicle volume and more on service capture, retention and execution discipline.",
        "Aftersales is becoming a strategic stability lever, not just an operational function.",
        "The strongest near-term path is likely one that improves customer retention and service conversion without requiring heavy capital deployment.",
      ],
      recommendedActions: [
        "Prioritise a 30-day aftersales resilience and retention push across the group.",
        "Tighten parts-risk monitoring for high-delay categories and customer-impact areas.",
        "Launch a board-level operating rhythm around service conversion, booking flow and retention performance.",
        "Package value-led service and ownership offers for customers delaying replacement cycles.",
      ],
      selectedPathRationale:
        "The best immediate path is a rapid aftersales resilience programme because it protects margin, improves customer continuity, and converts current market pressure into a repeatable commercial advantage without requiring major structural change.",
      supportingSignals: [
        "Growing maintenance demand from extended vehicle ownership",
        "Service-led retention outperformance among better-executing dealer groups",
        "Operational exposure from logistics and parts variability",
      ],
      strategicPaths: [
        {
          id: "auto-path-1",
          name: "Rapid Aftersales Resilience Push",
          approach:
            "Launch a 30-day cross-site programme focused on service capture, booking flow, delay management and retention offers.",
          whereItWins:
            "Best when the organisation needs fast margin protection and a practical response to live operating pressure.",
          risks: [
            "Execution discipline may vary across sites",
            "Inconsistent service teams could reduce impact",
          ],
          requirements: [
            "Clear operational owner",
            "Simple KPI pack",
            "Fast site-level rollout",
          ],
          recommended: true,
        },
        {
          id: "auto-path-2",
          name: "Used Car Margin Defence Focus",
          approach:
            "Concentrate leadership attention on pricing discipline, stock turn, and targeted consumer conversion strategy.",
          whereItWins:
            "Best when used vehicle pressure is the main commercial issue.",
          risks: [
            "May not fully capture aftersales upside",
            "Can become too defensive if isolated from service strategy",
          ],
          requirements: [
            "Tighter pricing governance",
            "Faster stock visibility",
            "Local conversion analytics",
          ],
          recommended: false,
        },
        {
          id: "auto-path-3",
          name: "Wait-and-Monitor Approach",
          approach:
            "Minimise change, monitor conditions closely, and preserve optionality until signals strengthen further.",
          whereItWins:
            "Best when management confidence is low and execution bandwidth is constrained.",
          risks: [
            "Opportunity window may be lost",
            "Competitors may strengthen retention advantage first",
          ],
          requirements: [
            "Strong monitoring discipline",
            "Executive patience",
            "Clear trigger thresholds",
          ],
          recommended: false,
        },
      ],
      executionPhases: [
        {
          phase: "Immediate Actions",
          owner: "COO / Aftersales Director",
          timing: "0-7 days",
          actions: [
            "Identify highest-impact service bottlenecks across sites.",
            "Create a simple executive KPI pack for bookings, conversion, delays and retention activity.",
            "Assign a named owner for the resilience push and site reporting rhythm.",
          ],
        },
        {
          phase: "30-Day Rollout",
          owner: "Regional Operations / Site Leaders",
          timing: "1-4 weeks",
          actions: [
            "Standardise customer delay communication for parts-sensitive jobs.",
            "Launch value-led retention offers for vehicles staying in market longer.",
            "Improve booking flow and service follow-up process across priority locations.",
          ],
        },
        {
          phase: "Scale & Refine",
          owner: "Leadership Team",
          timing: "30-90 days",
          actions: [
            "Track which service and retention plays deliver the strongest margin impact.",
            "Refine rollout based on high-performing sites.",
            "Decide whether to expand into broader ownership and warranty-led programmes.",
          ],
        },
      ],
    },
    planner: {
      dependencies: [
        "Site-level operational buy-in",
        "Shared KPI pack and weekly reporting rhythm",
        "Consistent service communication standards",
      ],
      risks: [
        "Patchy site adoption reducing rollout impact",
        "Retention offers becoming too generic",
        "Execution effort being absorbed by existing operational noise",
      ],
      successMeasures: [
        "Higher service booking conversion",
        "Lower delay-related customer dissatisfaction",
        "Improved aftersales revenue retention",
      ],
      reviewCheckpoints: [
        "7-day leadership review",
        "30-day rollout performance review",
        "90-day scale decision",
      ],
    },
  },

  energy: {
    key: "energy",
    label: "Energy Cost Pressure",
    description: "Operational cost stress and resilience response.",
    company: {
      name: "BrightForge Manufacturing",
      sector: "Industrial Manufacturing",
      markets: ["United Kingdom", "Western Europe"],
      strategicPriorities: [
        "Protect operating margin",
        "Reduce energy volatility exposure",
        "Stabilise output continuity",
      ],
      riskTolerance: "balanced",
      recommendationStyle: "boardroom",
    },
    summary: {
      overallRiskScore: 82,
      opportunityScore: 71,
      posture: "High Alert",
      opportunityPosture: "Selective Upside",
      urgency: "High",
      confidence: 84,
      horizon: "Immediate / 60 Days",
      executiveSummary:
        "GeoPulse is detecting significant cost pressure from energy volatility, but also a practical opportunity to strengthen resilience through efficiency action, supplier repricing and targeted operational adjustments.",
    },
    signals: [
      {
        id: "energy-1",
        headline:
          "Industrial power pricing remains volatile across selected UK supply contracts",
        summary:
          "Energy-sensitive operators may face margin compression if they lack pricing flexibility or hedging protection.",
        source: "Reuters",
        sourceType: "news",
        region: "UK",
        clusterTag: "Energy Cost",
        kind: "risk",
        severity: "high",
        confidence: 87,
        strength: 86,
        relativeTime: "25 mins ago",
        lifecycle: "Fresh",
      },
      {
        id: "energy-2",
        headline:
          "Manufacturers accelerating efficiency upgrades to reduce short-term energy exposure",
        summary:
          "Efficiency action and usage optimisation are becoming more attractive as quick resilience measures.",
        source: "Bloomberg",
        sourceType: "news",
        region: "Europe",
        clusterTag: "Efficiency Response",
        kind: "opportunity",
        severity: "medium",
        confidence: 80,
        strength: 73,
        relativeTime: "1h ago",
        lifecycle: "Watch",
      },
      {
        id: "energy-3",
        headline:
          "Input cost pass-through remains difficult in price-sensitive contract segments",
        summary:
          "Manufacturers with weak repricing flexibility may see margin erosion persist longer.",
        source: "Financial Times",
        sourceType: "news",
        region: "UK / Europe",
        clusterTag: "Pricing Pressure",
        kind: "risk",
        severity: "medium",
        confidence: 83,
        strength: 78,
        relativeTime: "2h ago",
        lifecycle: "Watch",
      },
    ],
    chain: {
      input:
        "Assess the immediate risk from energy cost pressure and identify the strongest resilience-led response path.",
      situationOverview:
        "BrightForge Manufacturing is facing active margin pressure from energy volatility, with limited room to absorb sustained cost spikes. The strongest response path is operational resilience rather than passive monitoring.",
      keyDrivers: [
        "Power price volatility is feeding direct cost pressure.",
        "Contract repricing flexibility is limited in selected customer segments.",
        "Efficiency action can reduce exposure faster than structural transformation.",
      ],
      whatThisMeans: [
        "This is a live operating risk, not just a forecasting issue.",
        "Leadership needs a near-term cost discipline plan with measurable actions.",
        "Quick resilience wins matter more than long-range transformation in the first phase.",
      ],
      recommendedActions: [
        "Launch a 30-day energy resilience sprint.",
        "Review largest energy-intense processes first.",
        "Escalate customer repricing review in the most exposed segments.",
      ],
      selectedPathRationale:
        "The strongest immediate path is a resilience sprint that reduces exposure quickly while preserving room for later structural efficiency upgrades.",
      supportingSignals: [
        "Persistent industrial energy volatility",
        "Growing use of fast efficiency responses",
        "Weak pass-through in price-sensitive contracts",
      ],
      strategicPaths: [
        {
          id: "energy-path-1",
          name: "30-Day Energy Resilience Sprint",
          approach:
            "Prioritise rapid exposure reduction, usage discipline, and high-impact process changes.",
          whereItWins:
            "Best for immediate margin protection under cost stress.",
          risks: ["Execution fatigue", "Limited savings if scope is too broad"],
          requirements: [
            "Operational owner",
            "Usage visibility",
            "Fast reporting cadence",
          ],
          recommended: true,
        },
        {
          id: "energy-path-2",
          name: "Contract Repricing Push",
          approach:
            "Focus leadership attention on repricing conversations and commercial contract recovery.",
          whereItWins:
            "Best where customer relationships allow fast renegotiation.",
          risks: ["Commercial resistance", "Potential volume loss"],
          requirements: [
            "Sales alignment",
            "Contract prioritisation",
            "Executive sponsorship",
          ],
          recommended: false,
        },
      ],
      executionPhases: [
        {
          phase: "Immediate Actions",
          owner: "Operations Director",
          timing: "0-7 days",
          actions: [
            "Map the highest energy-intensity processes.",
            "Create a daily energy exposure dashboard.",
            "Set resilience targets for priority operational teams.",
          ],
        },
        {
          phase: "Resilience Sprint",
          owner: "Operations + Finance",
          timing: "1-4 weeks",
          actions: [
            "Run targeted efficiency interventions.",
            "Review shift and process design for avoidable usage peaks.",
            "Escalate repricing review where contracts are most exposed.",
          ],
        },
      ],
    },
    planner: {
      dependencies: [
        "Reliable process-level usage visibility",
        "Operations and finance alignment",
        "Executive approval for rapid interventions",
      ],
      risks: [
        "Insufficient measurement discipline",
        "Commercial drag on repricing discussions",
        "Operational teams overloaded by parallel priorities",
      ],
      successMeasures: [
        "Reduced energy-intensity in priority operations",
        "Lower short-term margin exposure",
        "Stronger weekly resilience reporting",
      ],
      reviewCheckpoints: [
        "7-day exposure review",
        "30-day resilience outcome review",
      ],
    },
  },

  supply: {
    key: "supply",
    label: "Supply Chain Disruption",
    description: "Continuity risk, lead-time pressure and response planning.",
    company: {
      name: "VectorBuild Components",
      sector: "Industrial Supply & Distribution",
      markets: ["United Kingdom", "Europe"],
      strategicPriorities: [
        "Protect continuity",
        "Preserve customer trust",
        "Reduce disruption impact",
      ],
      riskTolerance: "balanced",
      recommendationStyle: "boardroom",
    },
    summary: {
      overallRiskScore: 80,
      opportunityScore: 69,
      posture: "Heightened Attention",
      opportunityPosture: "Measured Opportunity",
      urgency: "Elevated",
      confidence: 83,
      horizon: "Immediate / Near-Term",
      executiveSummary:
        "GeoPulse is detecting active continuity pressure from supply chain disruption, but also a window to strengthen customer trust through proactive communication, prioritisation and service continuity planning.",
    },
    signals: [
      {
        id: "supply-1",
        headline:
          "Port congestion and route delays extend inbound lead times for selected industrial categories",
        summary:
          "Distributors and manufacturers may face instability in delivery timing and fulfilment planning.",
        source: "Reuters",
        sourceType: "news",
        region: "Global / Europe",
        clusterTag: "Logistics Delay",
        kind: "risk",
        severity: "high",
        confidence: 86,
        strength: 85,
        relativeTime: "35 mins ago",
        lifecycle: "Fresh",
      },
      {
        id: "supply-2",
        headline:
          "Customers reward suppliers who communicate disruption impact early and clearly",
        summary:
          "Clear continuity communication is becoming a competitive differentiator during disruption periods.",
        source: "Financial Times",
        sourceType: "news",
        region: "Europe",
        clusterTag: "Continuity Trust",
        kind: "opportunity",
        severity: "medium",
        confidence: 78,
        strength: 72,
        relativeTime: "1h ago",
        lifecycle: "Watch",
      },
      {
        id: "supply-3",
        headline:
          "Short-notice sourcing shifts increase quality and fulfilment risk in pressured supply chains",
        summary:
          "Emergency supplier changes can reduce reliability if qualification is weak.",
        source: "Bloomberg",
        sourceType: "news",
        region: "Europe",
        clusterTag: "Supplier Risk",
        kind: "risk",
        severity: "medium",
        confidence: 82,
        strength: 77,
        relativeTime: "2h ago",
        lifecycle: "Watch",
      },
    ],
    chain: {
      input:
        "Assess the continuity risk from current supply chain disruption and identify the strongest near-term response path.",
      situationOverview:
        "VectorBuild Components is exposed to delivery timing instability and customer service risk. The strongest near-term path is not panic sourcing, but disciplined continuity management and customer-facing control.",
      keyDrivers: [
        "Lead times are extending in the most sensitive categories.",
        "Customers are more tolerant of disruption when communication is strong.",
        "Reactive sourcing can increase secondary quality and fulfilment risks.",
      ],
      whatThisMeans: [
        "Leadership should prioritise continuity control over reactive expansion of supplier risk.",
        "Customer trust can be protected even when delivery timing is under pressure.",
        "A good response path will blend prioritisation, communication and disciplined sourcing decisions.",
      ],
      recommendedActions: [
        "Create a continuity command rhythm for priority categories.",
        "Segment customers by service criticality and delivery sensitivity.",
        "Strengthen disruption communication standards immediately.",
      ],
      selectedPathRationale:
        "The strongest path is a continuity control programme that preserves customer trust and service quality while reducing secondary risk from rushed sourcing decisions.",
      supportingSignals: [
        "Extended lead-time pressure",
        "Customer preference for proactive communication",
        "Quality risk from emergency supplier shifts",
      ],
      strategicPaths: [
        {
          id: "supply-path-1",
          name: "Continuity Control Programme",
          approach:
            "Focus on prioritisation, communication and disciplined service continuity management.",
          whereItWins:
            "Best for protecting customer trust under near-term disruption pressure.",
          risks: ["Requires strong internal coordination", "Can expose planning weaknesses"],
          requirements: [
            "Daily disruption visibility",
            "Customer segmentation",
            "Cross-functional owner",
          ],
          recommended: true,
        },
        {
          id: "supply-path-2",
          name: "Aggressive Alternative Sourcing",
          approach:
            "Push hard into fast alternative sourcing to reduce dependence on delayed routes.",
          whereItWins:
            "Best when supply concentration is dangerously high.",
          risks: ["Quality issues", "Supplier qualification risk", "Higher cost"],
          requirements: [
            "Supplier validation",
            "Commercial flexibility",
            "Risk controls",
          ],
          recommended: false,
        },
      ],
      executionPhases: [
        {
          phase: "Immediate Actions",
          owner: "Supply Chain Director",
          timing: "0-7 days",
          actions: [
            "Identify the most disruption-sensitive categories.",
            "Create a continuity watchlist for priority customers.",
            "Standardise disruption communication templates.",
          ],
        },
        {
          phase: "Control Programme",
          owner: "Operations + Customer Teams",
          timing: "1-4 weeks",
          actions: [
            "Run customer segmentation and service prioritisation.",
            "Track exception orders daily.",
            "Escalate only the most justified alternative sourcing moves.",
          ],
        },
      ],
    },
    planner: {
      dependencies: [
        "Strong order and category visibility",
        "Cross-functional continuity ownership",
        "Customer-facing communication discipline",
      ],
      risks: [
        "Internal coordination delays",
        "Overreaction causing secondary supplier risk",
        "Customer trust erosion if messaging is inconsistent",
      ],
      successMeasures: [
        "Improved service continuity in priority segments",
        "Lower exception-order disruption",
        "Stronger customer trust during disruption windows",
      ],
      reviewCheckpoints: [
        "Daily continuity stand-up",
        "Weekly executive disruption review",
      ],
    },
  },
};

export const demoScenarioList = Object.values(demoScenarios).map((scenario) => ({
  key: scenario.key,
  label: scenario.label,
  description: scenario.description,
}));