import { Article } from "../lib/types";

export interface DemoAgenda {
  id: number;
  title: string;
  created_at: string;
  articles: Article[];
}

export const INITIAL_DEMO_AGENDAS: DemoAgenda[] = [
  {
    id: 1,
    title: "The Earth is Flat",
    created_at: new Date().toISOString(),
    articles: [
      {
        id: "101",
        title: "The Horizon Looks Flat",
        description: "If you look at the horizon, it's a straight line. Explain that, round-earthers!",
        url: "https://example.com/flat-earth",
        image: "https://placehold.co/600x400/2a2a2a/FFF?text=Horizon",
        agenda_id: "1",
        created_at: new Date().toISOString()
      },
      {
        id: "102",
        title: "Water Doesn't Curve",
        description: "Water always finds its level. Checkmate.",
        url: "https://example.com/water-level",
        image: "https://placehold.co/600x400/1a3a5a/FFF?text=Water",
        agenda_id: "1",
        created_at: new Date().toISOString()
      }
    ]
  },
  {
    id: 2,
    title: "Birds Aren't Real",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    articles: [
      {
        id: "201",
        title: "Drone Surveillance",
        description: "They sit on power lines to charge. It's obvious.",
        url: "https://birdsarentreal.com",
        image: "https://placehold.co/600x400/5a1a1a/FFF?text=Birds",
        agenda_id: "2",
        created_at: new Date().toISOString()
      }
    ]
  }
];

export const DEMO_USER = {
  id: 999,
  name: "Demo User",
  email: "demo@example.com"
};
