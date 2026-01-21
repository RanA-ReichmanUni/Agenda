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
    content: 'Agenda allows you to curate narratives and back them up with evidence. This is a demo version - feel free to explore!',
    position: 'right'
  },
  {
    targetId: 'tutorial-create-agenda',
    title: 'Create a Topic',
    content: 'Start by creating a new Agenda. Think of it as a folder for a specific argument or narrative you want to argue.',
    position: 'top'
  },
  {
    targetId: 'tutorial-agenda-list',
    title: 'Your Agendas',
    content: 'Your agendas live here. We have pre-loaded a few examples for you to check out.',
    position: 'bottom'
  }
];

export const DEMO_AGENDA_STEPS: TutorialStep[] = [
  {
    targetId: 'tutorial-agenda-subject',
    title: 'The Subject',
    content: 'This is the core topic of your agenda.',
    position: 'right'
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
    content: 'All your collected sources and evidence appear here. Click them to preview content without leaving the page.',
    position: 'top'
  },
  {
    targetId: 'analyze-agenda-btn',
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

// Ghost Mode narration steps - synchronized with AutoPilot actions
export const GHOST_NARRATION = {
  welcome: {
    targetId: 'tutorial-branding',
    title: '👻 Ghost Demo Starting',
    content: 'Watch as we demonstrate Agenda\'s key features automatically. Sit back and enjoy the tour!<div dir="rtl" style="text-align:right;margin-top:8px;">צפו כיצד אנו מציגים באופן אוטומטי את היכולות המרכזיות של אג\'נדה. הישענו לאחור ותיהנו מהסיור!</div>',
    position: 'right' as const
  },
  createInput: {
    targetId: 'create-agenda-input',
    title: '📝 Creating an Agenda',
    content: 'First, we\'ll create a new agenda. This is where you organize evidence around a specific topic or argument.<div dir="rtl" style="text-align:right;margin-top:8px;">נתחיל ביצירת אג\'נדה חדשה. כאן מארגנים ראיות סביב נושא או טיעון מסוים.</div>',
    position: 'right' as const
  },
  submitAgenda: {
    targetId: 'create-agenda-submit',
    title: '✨ Submitting',
    content: 'Click to create your new agenda and start collecting evidence.<div dir="rtl" style="text-align:right;margin-top:8px;">לחצו כדי ליצור את האג\'נדה החדשה ולהתחיל לאסוף ראיות.</div>',
    position: 'left' as const
  },
  openAgenda: {
    targetId: 'tutorial-agenda-list',
    title: '📂 Opening Your Agenda',
    content: 'Your new agenda appears here. Let\'s open it to add some sources.<div dir="rtl" style="text-align:right;margin-top:8px;">האג\'נדה החדשה שלכם מופיעה כאן. נפתח אותה כדי להוסיף מקורות.</div>',
    position: 'top' as const
  },
  addArticle: {
    targetId: 'add-article-url',
    title: '🔗 Adding Evidence',
    content: 'Paste any URL to add it as evidence. We\'ll automatically extract the article metadata.<div dir="rtl" style="text-align:right;margin-top:8px;">הדביקו כל כתובת כדי להוסיף אותה כראיה. נחלץ אוטומטית את נתוני המטא של הכתבה.</div>',
    position: 'right' as const
  },
  fetchArticle: {
    targetId: 'add-article-submit',
    title: '🔍 Fetching Info',
    content: 'Click to fetch the article\'s title, image, and description automatically.<div dir="rtl" style="text-align:right;margin-top:8px;">לחצו כדי למשוך אוטומטית את כותרת הכתבה, התמונה והתיאור.</div>',
    position: 'left' as const
  },
  confirmArticle: {
    targetId: 'add-article-final-btn',
    title: '✅ Confirming',
    content: 'Review the fetched data and add it to your evidence board.<div dir="rtl" style="text-align:right;margin-top:8px;">עברו על הנתונים שנשלפו והוסיפו אותם ללוח הראיות.</div>',
    position: 'left' as const
  },
  moreArticles: {
    targetId: 'tutorial-evidence-grid',
    title: '📚 Building Evidence',
    content: 'Adding more sources strengthens your narrative. Watch as we add a few more.<div dir="rtl" style="text-align:right;margin-top:8px;">הוספת עוד מקורות מחזקת את האג\'נדה שלכם. צפו איך אנחנו מוסיפים עוד כמה.</div>',
    position: 'top' as const
  },
  verifyAgenda: {
    targetId: 'analyze-agenda-btn',
    title: '🤖 AI Verification',
    content: 'With all evidence collected, let\'s use AI to analyze credibility and bias.<div dir="rtl" style="text-align:right;margin-top:8px;">לאחר שאספנו את כל הראיות, נשתמש בבינה מלאכותית כדי לנתח אמינות והטיות.</div>',
    position: 'top' as const
  },
  analysisComplete: {
    targetId: 'close-analysis-btn',
    title: '📊 Analysis Complete',
    content: 'The AI has scored your evidence! Review the reliability and bias scores.<div dir="rtl" style="text-align:right;margin-top:8px;">הבינה המלאכותית נתנה ציון לראיות שלכם! עברו על ציוני האמינות וההטיה.</div>',
    position: 'center' as const
  },
  shareAgenda: {
    targetId: 'tutorial-share-button',
    title: '🚀 Share Your Work',
    content: 'Finally, generate a public link to share your curated narrative with the world!<div dir="rtl" style="text-align:right;margin-top:8px;">לבסוף, צרו קישור ציבורי כדי לשתף את האג\'נדה שאספתם עם העולם!</div>',
    position: 'bottom' as const
  },
  complete: {
    targetId: 'tutorial-demo-banner',
    title: '🎉 Tour Complete!',
    content: 'You\'ve seen the full Agenda workflow: Create → Collect Evidence → Verify with AI → Share. Now it\'s your turn, explore the features yourself and build your own narrative!<div dir="rtl" style="text-align:right;margin-top:8px;">ראיתם את כל הזרימה של אג\'נדה: יצירה -> איסוף ראיות -> בדיקת בינה מלאכותית -> שיתוף. עכשיו תורכם, גלו את הפיצ\'רים בעצמכם ובנו את האג\'נדה שלכם!</div>',
    position: 'bottom' as const
  }
};