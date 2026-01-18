export interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export const DEMO_MODE_EXPLANATION: TutorialStep[] = [
  {
    targetId: 'tutorial-demo-banner',
    title: 'About Demo Mode',
    content: 'You are currently in Demo Mode. \n\nThis is a fully local sandbox environment. All data you create here (Agendas, Articles) is stored only in your browser\'s Local Storage and will not persist across devices or browsers.\n\nUse this mode to explore the UI and features without needing an account. To save your work permanently, please sign up for a full account.',
    position: 'bottom'
  }
];

export const DEMO_HOME_STEPS: TutorialStep[] = [
  {
    targetId: 'tutorial-branding',
    title: 'Welcome to Agenda',
    content: 'Agenda allows you to curate narratives and back them up with sources. This is a demo version - feel free to explore!',
    position: 'bottom'
  },
  {
    targetId: 'tutorial-create-agenda',
    title: 'Create a Topic',
    content: 'Start by creating a new Agenda. Think of it as a folder for a specific argument or storyline you want to track.',
    position: 'top'
  },
  {
    targetId: 'tutorial-agenda-list',
    title: 'Your Collection',
    content: 'Your agendas live here. We have pre-loaded a few examples for you to check out.',
    position: 'bottom'
  }
];

export const DEMO_AGENDA_STEPS: TutorialStep[] = [
  {
    targetId: 'tutorial-agenda-subject',
    title: 'The Subject',
    content: 'This is the core topic of your agenda.',
    position: 'bottom'
  },
  {
    targetId: 'tutorial-add-article',
    title: 'Add Sources',
    content: 'Paste any URL here. We will extract the metadata and add it to your evidence board.',
    position: 'bottom'
  },
  {
    targetId: 'tutorial-evidence-grid',
    title: 'The Evidence',
    content: 'All your collected articles appear here. Click them to preview content without leaving the page.',
    position: 'top'
  },
  {
    targetId: 'tutorial-verify-ai',
    title: 'Verify with AI',
    content: 'Use our AI to analyze the credibility of your collected evidence and generate a reliability score for your narrative.',
    position: 'top'
  },
  {
    targetId: 'tutorial-share-button',
    title: 'Share Your Agenda',
    content: 'Ready to publish? Generate a public link to share your curated narrative with others.',
    position: 'bottom'
  }
];