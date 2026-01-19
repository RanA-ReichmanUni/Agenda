import { Article, AnalysisResult } from "../lib/types";

export interface DemoAgenda {
  id: number;
  title: string;
  createdAt: string;
  articles: Article[];
  share_token?: string;
  analysisResult?: AnalysisResult;
}

export const INITIAL_DEMO_AGENDAS: DemoAgenda[] = [
  {
  id: 1,
  title: "All Smartphones Are Bland and Converged",
  createdAt: new Date().toISOString(),
  articles: [
    {
      id: "101",
      title: "Smartphone Design Plateaued in 2024",
      url: "https://gizmodo.com/smartphone-design-plateaued-in-2024-2000540663",
      description: "Argues that Samsung, Google, and Apple prioritized AI features over genuine hardware innovation, leaving phones virtually indistinguishable.",
      createdAt: new Date().toISOString(),
      agenda_id: "4",
      image: "https://gizmodo.com/app/uploads/2024/12/MAIN_Best-Smartphones.jpg"
    },
    {
      id: "102",
      title: "Smartphones Are Boring Now and It's Our Fault",
      url: "https://www.howtogeek.com/smartphones-are-boring-now-and-its-our-fault/",
      description: "Explains how consumer demand for reliability over novelty has pushed manufacturers toward identical, safe designs.",
      createdAt: new Date().toISOString(),
      agenda_id: "4",
      image: "https://static0.howtogeekimages.com/wordpress/wp-content/uploads/2025/03/galaxy-s24-phones-on-a-table.jpg?q=70&fit=crop&w=1568&h=1078&dpr=1"
    },
    {
      id: "103",
      title: "Yes, many flagship phones now look the same – but I don't think it's a bad thing",
      url: "https://www.techradar.com/phones/yes-many-flagship-phones-now-look-the-same-but-i-dont-think-its-a-bad-thing",
      description: "Acknowledges that flagship phones from Apple, Samsung, Google, and OnePlus have blurred together in design.",
      createdAt: new Date().toISOString(),
      agenda_id: "4",
      image: "https://cdn.mos.cms.futurecdn.net/6yXiWTRbSBYGXJqSgSfXeZ-1920-80.jpg.webp"
    },
    {
      id: "104",
      title: "Why do all smartphones look the same?",
      url: "https://www.phonearena.com/news/Why-do-all-smartphones-look-the-same_id124123",
      description: "Explains that bezel-less displays and large batteries leave little room for variety, and manufacturers keep choosing safe options.",
      createdAt: new Date().toISOString(),
      agenda_id: "4",
      image: "https://m-cdn.phonearena.com/images/article/124123-wide-two_1200/Why-do-all-smartphones-look-the-same.webp?1589801759"
    }
  ]
},
{
  id: 2,
  title: "Cash Is Superior to Digital Payments",
  createdAt: new Date().toISOString(),
  articles: [
    {
      id: "301",
      title: "Cash is… protection of privacy, identity and data",
      url: "https://www.cashmatters.org/blog/cash-isprivate-and-protects-freedom-of-choice/",
      description: "Explains that cash is the only payment method offering complete privacy, protecting from data and identity theft.",
      createdAt: new Date().toISOString(),
      agenda_id: "5",
      image: "https://faisalkhan.com/wp-content/uploads/2024/11/Cash-vs-Digital-Payments-Why-Cash-is-King.png"
    },
    {
      id: "302",
      title: "Can CBDCs give us the same freedom as cash?",
      url: "https://www.weforum.org/stories/2023/09/digital-currencies-privacy-freedom/",
      description: "World Economic Forum acknowledges that electronic payment systems do not provide the same personal freedom that cash offers.",
      createdAt: new Date().toISOString(),
      agenda_id: "5",
      image: "https://assets.weforum.org/article/image/responsive_big_webp_gpQefyNTBkws-owy4xxUe6BBG6yWzwyJDb1pDOFETxo.webp"
    },
    {
      id: "303",
      title: "Why digital can't replace cash",
      url: "https://blog.beuc.eu/why-digital-cant-replace-cash/",
      description: "Consumer advocacy group argues cash is the only payment instrument guaranteeing privacy and anonymity.",
      createdAt: new Date().toISOString(),
      agenda_id: "5",
      image: "https://blog.beuc.eu/wp-content/uploads/2016/06/shutterstock_113056159-1300x867.jpg"
    },
    {
      id: "304",
      title: "Cash vs Digital Payments: Why Cash is King",
      url: "https://faisalkhan.com/2024/11/11/cash-vs-digital-payments-why-cash-is-king/",
      description: "Claims every digital transaction erodes value via fees, while cash preserves full value across exchanges.",
      createdAt: new Date().toISOString(),
      agenda_id: "5",
      image: "https://faisalkhan.com/wp-content/uploads/2024/11/Cash-vs-Digital-Payments-Why-Cash-is-King.png"
    }
  ]
},

{
  id: 3,
  title: "U.S. Health Care Politics Put Insurance Companies First, Patients Second",
  createdAt: new Date().toISOString(),
  articles: [
    {
      id: "501",
      title: "Trump and Republicans again face a tough political battle over Obama's health care law",
      url: "https://www.pbs.org/newshour/politics/trump-and-republicans-again-face-a-tough-political-battle-over-obamas-health-care-law",
      description: "Reports how renewed efforts to weaken or reshape the Affordable Care Act risk higher premiums for millions and repeat past Republican failures.",
      createdAt: new Date().toISOString(),
      agenda_id: "3",
      image: "https://d3i6fh83elv35t.cloudfront.net/static/2025/11/2025-11-17T235732Z_93810286_RC2BYHAQ1YYZ_RTRMADP_3_USA-TRUMP-1200x800.jpg"
    },
    {
      id: "502",
      title: "The Politics of Health Care and Elections",
      url: "https://www.kff.org/elections/health-policy-101-the-politics-of-health-care-and-elections/",
      description: "Explains how both parties use health care as an election weapon, trading off coverage, cost, and federal spending in ways that leave voters anxious.",
      createdAt: new Date().toISOString(),
      agenda_id: "3",
      image: "https://www.kff.org/wp-content/uploads/sites/7/2024/05/KFF_SF_Office_Timeline_Norman_22.jpg"
    },
    {
      id: "504",
      title: "Why Both Republicans and Democrats Are Wrong About Health Care",
      url: "https://www.nytimes.com/2025/12/16/opinion/republicans-democrats-health-care.html",
      description: "Argues that both parties dodge the core trade‑off: you cannot have cheap, universal, unlimited care without someone clearly paying the bill.",
      createdAt: new Date().toISOString(),
      agenda_id: "3",
      image: "https://static01.nyt.com/images/2025/12/16/opinion/16orszag-image/16orszag-image-superJumbo.jpg"
    }
  ]
},
{
  id: 4,
  title: "AI Chatbots Make People Dumber",
  createdAt: new Date().toISOString(),
  articles: [
    {
      id: "401",
      title: "MIT Study Finds ChatGPT Can Harm Critical Thinking Over Time",
      url: "https://www.technewsworld.com/story/mit-study-finds-chatgpt-can-harm-critical-thinking-over-time-179801.html",
      description: "MIT research shows ChatGPT users had the lowest brain engagement in EEG measurements and became less diligent over time.",
      createdAt: new Date().toISOString(),
      agenda_id: "4",
      image: "https://www.technewsworld.com/wp-content/uploads/sites/3/2025/04/students-in-classroom.jpg"
    },
    {
      id: "402",
      title: "ChatGPT's Impact On Our Brains According to an MIT Study",
      url: "https://time.com/7295195/ai-chatgpt-google-learning-school/",
      description: "Reports that increasing reliance on AI tools could reduce critical thinking, creativity, and problem-solving across populations.",
      createdAt: new Date().toISOString(),
      agenda_id: "4",
      image: "https://cdn.mos.cms.futurecdn.net/kSArVmiGReJ4zKxxhr5Bm7.jpg"
    },
    {
      id: "404",
      title: "Generative AI and the risk of cognitive offloading",
      url: "https://siliconangle.com/2025/09/05/hidden-risks-cognitive-offloading/",
      description: "Explores how constant AI assistance encourages cognitive offloading, where people stop practicing core mental skills.",
      createdAt: new Date().toISOString(),
      agenda_id: "4",
      image: "https://d15shllkswkct0.cloudfront.net/wp-content/blogs.dir/1/files/2025/09/AI-human-relationship.png"
    }
  ]
},


 {
    id: 5,
    title: "Paper Books Are Superior to Screens",
    createdAt: new Date().toISOString(),
    articles: [
      {
        id: "201",
        title: "Screen vs. Paper: Which One Boosts Reading Comprehension?",
        url: "https://oxfordlearning.com/screen-vs-paper-which-one-boosts-reading-comprehension/",
        description: "Drawing parallels between the 19th-century backlash against photography and today's AI skepticism.",
        createdAt: new Date().toISOString(),
        agenda_id: "5",
        image:"https://oxfordlearning.com/wp-content/uploads/2025/03/reading-comprehension-860x420-1.jpg"
        // ...existing code...
      },
      {
        id: "202",
        title: "Reading on screens instead of paper is a less effective way to absorb and retain information, suggests research",
        url: "https://phys.org/news/2024-02-screens-paper-effective-absorb-retain.html",
        description: "Why the human element of taste and selection matters more than the mechanical act of drawing.",
        createdAt: new Date().toISOString(),
        agenda_id: "5",
        image: "https://scx1.b-cdn.net/csz/news/800a/2024/reading-on-screens-is.jpg"
        // ...existing code...
      }
    ]
  },
  {
    id: 6,
    title: "Smartphones Destroying Our Mental Health",
    createdAt: new Date().toISOString(),
    articles: [
      {
        id: "401",
        title: "Early smartphone use linked to poorer mental health in young adults",
        url: "https://www.news-medical.net/news/20250721/Early-smartphone-use-linked-to-poorer-mental-health-in-young-adults.aspx",
        description: "The data is clear: giving a child a smartphone before age 13 is correlated with significantly higher rates of suicidal thoughts and aggression.",
        createdAt: new Date().toISOString(),
        agenda_id: "6",
        image: "https://peakbehavioral.com/wp-content/uploads/2023/02/How-Your-Smartphone-Can-Help-and-Hurt-Your-Mental-Wellness.jpg"
      },
      {
        id: "402",
        title: "Smartphones, Social Media, and Their Impact on Mental Health",
        url: "https://www.columbiapsychiatry.org/research/research-areas/child-and-adolescent-psychiatry/sultan-lab-mental-health-informatics/research-areas/smartphones-social-media-and-their-impact-mental-health",
        description: "We have rewired childhood to be sedentary, solitary, and sleep-deprived. The mental health crisis is a direct result of the phone in their pocket.",
        createdAt: new Date().toISOString(),
        agenda_id: "6",
        image: "https://npr.brightspotcdn.com/dims3/default/strip/false/crop/2116x1417+0+0/resize/2116x1417!/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2Fdb%2F3b%2F2c7c463649f49f9c67ef94fb269f%2Fgettyimages-2160300581.jpg"
      }
    ]
  },
  {
    id: 7,
    title: "The 4-Day Work Week Is Ideal",
    createdAt: new Date().toISOString(),
    articles: [
      {
        id: "301",
        title: "The results are in: The UK's four-day week pilot was a resounding success",
        url: "https://autonomy.work/portfolio/uk4dwpilotresults/",
        description: "Revenue stayed up, burnout went down. 92% of companies in the world's largest trial have no intention of returning to the five-day grind.",
        createdAt: new Date().toISOString(),
        agenda_id: "7",
        image: "https://autonomy.work/wp-content/uploads/2023/02/Screenshot-2023-02-20-at-10.27.48.png"
      },
      {
        id: "302",
        title: "The rise of the 4-day workweek",
        url: "https://www.apa.org/monitor/2025/01/rise-of-4-day-workweek",
        description: "Microsoft Japan saw a 40% productivity boost. The five-day week is a relic of the industrial revolution that no longer serves the information age.",
        createdAt: new Date().toISOString(),
        agenda_id: "7",
        image: "https://www.apa.org/images/2025-01-workweek-tile_tcm7-334468.jpg"
      }
    ]
  },

];

export const DEMO_USER = {
  id: 999,
  name: "Demo User",
  email: "demo@example.com"
};
