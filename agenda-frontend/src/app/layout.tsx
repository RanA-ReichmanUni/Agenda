import './globals.css';  // ✅ This is the Tailwind entry point

// This file is responsible for defining the root layout of the entire app
import { AgendaProvider } from "../context/AgendaContext"; // Import the context provider


export const metadata = {
  title: 'Agenda',
  description: 'Create your own narrative',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Wrapping the entire app in AgendaProvider allows all pages and components
            to access and update the shared agenda list via context */}
        <AgendaProvider>
          {children}
        </AgendaProvider>
      </body>
    </html>
  );
}

