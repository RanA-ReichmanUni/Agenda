import './globals.css';  // ✅ This is the Tailwind entry point

export const metadata = {
  title: 'Agenda',
  description: 'Create your own narrative',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
