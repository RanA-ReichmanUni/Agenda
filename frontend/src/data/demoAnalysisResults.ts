import { AnalysisResult } from "../lib/types";

// --- Hardcoded Static Analysis Results for Demo Mode ---
// numeric_score follows the production formula: mean per-article support score,
// scaled by corroboration (source count) and domain diversity.
export const DEMO_ANALYSIS_RESULTS: Record<number, AnalysisResult> = {
  1: {
    score: 'High',
    numeric_score: 81,
    article_scores: [
      { id: 'a0', title: 'Smartphone design plateaued in 2024', topic: 'Smartphone design stagnation', verdict: 'Relevant', score: 88 },
      { id: 'a1', title: 'Smartphones are boring now — and it\'s our fault', topic: 'Consumer demand for identical phones', verdict: 'Relevant', score: 82 },
      { id: 'a2', title: 'Yes, many flagship phones now look the same', topic: 'Flagship design convergence', verdict: 'Relevant', score: 74 },
      { id: 'a3', title: 'Why do all smartphones look the same', topic: 'Form-factor optimization', verdict: 'Relevant', score: 80 },
    ],
    reasoning: "Analysis of 4 technology sources (Gizmodo, HowToGeek, TechRadar, PhoneArena) indicates a strong consensus. The articles consistently report that form factors have plateaued and become 'boring' due to physical optimization and consumer demand for reliability, supporting the claim.",
    claim: "All Smartphones Are Bland and Boring",
    is_cached: true,
    is_stale: false,
    articleCount: 4
  },
  2: {
    score: 'Medium',
    numeric_score: 67,
    article_scores: [
      { id: 'a0', title: 'Cash is… protection of privacy, identity and data', topic: 'Cash privacy benefits', verdict: 'Relevant', score: 72 },
      { id: 'a1', title: 'Can CBDCs give us the same freedom as cash?', topic: 'Digital currency freedom limits', verdict: 'Relevant', score: 68 },
      { id: 'a2', title: 'Why digital can\'t replace cash', topic: 'Cash anonymity guarantees', verdict: 'Relevant', score: 70 },
      { id: 'a3', title: 'Cash vs Digital Payments: Why Cash is King', topic: 'Transaction fee erosion', verdict: 'Relevant', score: 58 },
    ],
    reasoning: "The provided articles from CashMatters, WEF, and BEUC strongly argue for cash's privacy benefits. However, the claim 'Cash is Superior' is broad; while superior for privacy/anonymity (High confidence), the sources do not comprehensively address convenience or security risks compared to digital, resulting in a Medium overall score for the general superiority claim.",
    claim: "Cash Is Superior to Digital Payments",
    is_cached: true,
    is_stale: false,
    articleCount: 4
  },
  3: {
    score: 'High',
    numeric_score: 83,
    article_scores: [
      { id: 'a0', title: 'Trump and Republicans again face a tough political battle over Obama\'s health care law', topic: 'Political battles over ACA', verdict: 'Relevant', score: 84 },
      { id: 'a1', title: 'The Politics of Health Care and Elections', topic: 'Health care as election weapon', verdict: 'Relevant', score: 78 },
      { id: 'a2', title: 'Why Both Republicans and Democrats Are Wrong About Health Care', topic: 'Partisan health policy trade-offs', verdict: 'Relevant', score: 86 },
    ],
    reasoning: "Sources from PBS, KFF, and NYT provide substantial evidence that political maneuvering often prioritizes election strategy over patient outcomes. The analysis highlights a pattern of 'weaponizing' healthcare policy rather than solving cost/coverage trade-offs, supporting the claim that political interests frequently supersede patient care.",
    claim: "U.S. Health Care Politics Put Insurance Companies First, Patients Second",
    is_cached: true,
    is_stale: false,
    articleCount: 3
  },
  4: {
    score: 'High',
    numeric_score: 85,
    article_scores: [
      { id: 'a0', title: 'MIT Study Finds ChatGPT Can Harm Critical Thinking Over Time', topic: 'EEG evidence of reduced engagement', verdict: 'Relevant', score: 90 },
      { id: 'a1', title: 'ChatGPT\'s Impact On Our Brains According to an MIT Study', topic: 'AI reliance and critical thinking', verdict: 'Relevant', score: 85 },
      { id: 'a2', title: 'Generative AI and the risk of cognitive offloading', topic: 'Cognitive offloading risks', verdict: 'Relevant', score: 79 },
    ],
    reasoning: "Multiple studies cited (including MIT research reported by Time and TechNewsWorld) directly support the claim. The evidence links AI chatbot usage to reduced 'brain engagement' (EEG data) and cognitive offloading, confirming the negative impact on critical thinking skills.",
    claim: "AI Chatbots Make People Dumber",
    is_cached: true,
    is_stale: false,
    articleCount: 3
  },
  5: {
    score: 'Medium',
    numeric_score: 66,
    article_scores: [
      { id: 'a0', title: 'Screen vs. Paper: Which One Boosts Reading Comprehension?', topic: 'Reading comprehension on paper', verdict: 'Relevant', score: 80 },
      { id: 'a1', title: 'Reading on screens instead of paper is a less effective way to absorb and retain information, suggests research', topic: 'Retention research findings', verdict: 'Relevant', score: 76 },
    ],
    reasoning: "Research provided (phys.org, Oxford Learning) supports the sub-claim that paper improves reading comprehension and retention. However, 'Superior' is a subjective value judgment. The evidence strongly supports paper for *learning*, but does not address portability or accessibility where screens excel.",
    claim: "Paper Books Are Superior to Screens",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  },
  6: {
    score: 'High',
    numeric_score: 73,
    article_scores: [
      { id: 'a0', title: 'Early smartphone use linked to poorer mental health in young adults', topic: 'Early smartphone use outcomes', verdict: 'Relevant', score: 88 },
      { id: 'a1', title: 'Smartphones, Social Media, and Their Impact on Mental Health', topic: 'Psychiatric research on phone use', verdict: 'Relevant', score: 84 },
    ],
    reasoning: "The claim is well-supported by the provided medical and psychiatric sources (News-Medical, Columbia Psychiatry). The articles cite specific correlations between early smartphone use and increased rates of suicidal thoughts, aggression, and poor mental health in young adults.",
    claim: "Smartphones Destroying Our Mental Health",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  },
  7: {
    score: 'High',
    numeric_score: 76,
    article_scores: [
      { id: 'a0', title: 'The results are in: The UK\'s four-day week pilot was a resounding success', topic: 'UK four-day week pilot results', verdict: 'Relevant', score: 92 },
      { id: 'a1', title: 'The rise of the 4-day workweek', topic: 'Productivity gains from shorter weeks', verdict: 'Relevant', score: 86 },
    ],
    reasoning: "Evidence from large-scale trials (UK Pilot, Microsoft Japan) cited by Autonomy and APA strongly supports the claim. The data shows clear improvements in revenue, productivity, and reduced burnout, validating the 'Ideal' characterization in a business context.",
    claim: "The 4-Day Work Week Is Ideal",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  },
  8: {
    score: 'High',
    numeric_score: 72,
    article_scores: [
      { id: 'a0', title: 'The Twisted History of Bissli, Israel\'s Most Iconic Snack', topic: 'Snack history and allergy data', verdict: 'Relevant', score: 88 },
      { id: 'a1', title: 'The Twisted History of Bissli, Israel\'s Most Iconic Snack', topic: 'Bamba brand heritage', verdict: 'Relevant', score: 82 },
    ],
    reasoning: "The debate between Bamba and Bissli is a classic cultural standoff, but the evidence leans towards Bamba due to its peanut-powered nutritional profile (and its ability to potentially reduce peanut allergies, as noted in studies). However, this comparison is largely subjective and humoristic in nature\u2014taste is the ultimate arbiter!",
    claim: "\u05D1\u05DE\u05D1\u05D4 \u05E2\u05D3\u05D9\u05E4\u05D4 \u05E2\u05DC \u05D1\u05D9\u05E1\u05DC\u05D9",
    is_cached: true,
    is_stale: false,
    articleCount: 2
  }
};
