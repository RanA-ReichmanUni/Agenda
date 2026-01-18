import { Article } from "../lib/types";

export interface DemoAgenda {
  id: number;
  title: string;
  createdAt: string;
  articles: Article[];
  share_token?: string;
}

export const INITIAL_DEMO_AGENDAS: DemoAgenda[] = [
 {
    id: 1,
    title: "Paper Books Are Superior to Screens",
    createdAt: new Date().toISOString(),
    articles: [
      {
        id: "201",
        title: "Screen vs. Paper: Which One Boosts Reading Comprehension?",
        url: "https://oxfordlearning.com/screen-vs-paper-which-one-boosts-reading-comprehension/",
        description: "Drawing parallels between the 19th-century backlash against photography and today's AI skepticism.",
        createdAt: new Date().toISOString(),
        agenda_id: "1",
        image:"https://oxfordlearning.com/wp-content/uploads/2025/03/reading-comprehension-860x420-1.jpg"
        // ...existing code...
      },
      {
        id: "202",
        title: "Reading on screens instead of paper is a less effective way to absorb and retain information, suggests research",
        url: "https://phys.org/news/2024-02-screens-paper-effective-absorb-retain.html",
        description: "Why the human element of taste and selection matters more than the mechanical act of drawing.",
        createdAt: new Date().toISOString(),
        agenda_id: "1",
        image: "https://scx1.b-cdn.net/csz/news/800a/2024/reading-on-screens-is.jpg"
        // ...existing code...
      }
    ]
  },
  {
    id: 2,
    title: "Smartphones Destroying Our Mental Health",
    createdAt: new Date().toISOString(),
    articles: [
      {
        id: "401",
        title: "Early smartphone use linked to poorer mental health in young adults",
        url: "https://www.news-medical.net/news/20250721/Early-smartphone-use-linked-to-poorer-mental-health-in-young-adults.aspx",
        description: "The data is clear: giving a child a smartphone before age 13 is correlated with significantly higher rates of suicidal thoughts and aggression.",
        createdAt: new Date().toISOString(),
        agenda_id: "2",
        image: "https://peakbehavioral.com/wp-content/uploads/2023/02/How-Your-Smartphone-Can-Help-and-Hurt-Your-Mental-Wellness.jpg"
      },
      {
        id: "402",
        title: "Smartphones, Social Media, and Their Impact on Mental Health",
        url: "https://www.columbiapsychiatry.org/research/research-areas/child-and-adolescent-psychiatry/sultan-lab-mental-health-informatics/research-areas/smartphones-social-media-and-their-impact-mental-health",
        description: "We have rewired childhood to be sedentary, solitary, and sleep-deprived. The mental health crisis is a direct result of the phone in their pocket.",
        createdAt: new Date().toISOString(),
        agenda_id: "2",
        image: "https://npr.brightspotcdn.com/dims3/default/strip/false/crop/2116x1417+0+0/resize/2116x1417!/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2Fdb%2F3b%2F2c7c463649f49f9c67ef94fb269f%2Fgettyimages-2160300581.jpg"
      }
    ]
  },
  {
    id: 3,
    title: "The 4-Day Work Week Is Ideal",
    createdAt: new Date().toISOString(),
    articles: [
      {
        id: "301",
        title: "The results are in: The UK's four-day week pilot was a resounding success",
        url: "https://autonomy.work/portfolio/uk4dwpilotresults/",
        description: "Revenue stayed up, burnout went down. 92% of companies in the world's largest trial have no intention of returning to the five-day grind.",
        createdAt: new Date().toISOString(),
        agenda_id: "3",
        image: "https://autonomy.work/wp-content/uploads/2023/02/Screenshot-2023-02-20-at-10.27.48.png"
      },
      {
        id: "302",
        title: "The rise of the 4-day workweek",
        url: "https://www.apa.org/monitor/2025/01/rise-of-4-day-workweek",
        description: "Microsoft Japan saw a 40% productivity boost. The five-day week is a relic of the industrial revolution that no longer serves the information age.",
        createdAt: new Date().toISOString(),
        agenda_id: "3",
        image: "https://www.apa.org/images/2025-01-workweek-tile_tcm7-334468.jpg"
      }
    ]
  },
  {
    id: 4,
    title: "Birds Aren't Real (Conspiracy Theory)",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    articles: [
      {
      id: "501",
      title: "Birds Aren't Real: The conspiracy theory that replaced birds with drones",
      url: "https://www.independent.co.uk/news/world/americas/birds-arent-real-conspiracy-theory-b2089768.html",
      description: "Open your eyes. The avian genocide happened between 1959 and 2001. Those things sitting on power lines? They are recharging their batteries.",
      createdAt: new Date().toISOString(),
      agenda_id: "4",
      image: "https://www.techeblog.com/wp-content/uploads/2023/01/flapping-wings-drones-lund-university.jpg"
    },
    {
      id: "502",
      title: "Inside the 'Birds Aren't Real' Movement",
      url: "https://www.nytimes.com/2021/12/09/technology/birds-arent-real-gen-z-misinformation.html",
      description: "If it flies, it spies. The CIA thinks they can fool us with feather-covered cameras, but the truth is out: the sky is a lie.",
      createdAt: new Date().toISOString(),
      agenda_id: "4",
      image: "https://static01.nyt.com/images/2021/12/08/business/00birds/merlin_198938148_b7d80dd2-a388-425b-86a4-525d5591219f-superJumbo.jpg"
    }
    ]
  }
];

export const DEMO_USER = {
  id: 999,
  name: "Demo User",
  email: "demo@example.com"
};
