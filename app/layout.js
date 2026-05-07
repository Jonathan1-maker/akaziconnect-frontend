import './globals.css';
import Navbar from '@/components/Navbar';
import { ThemeProvider } from '@/lib/ThemeContext';
import { SocketProvider } from '@/lib/SocketContext';
import { AuthProvider } from '@/lib/AuthContext';
import { NotificationProvider } from '@/lib/NotificationContext';
import { LangProvider } from '@/lib/LangContext';

export const metadata = {
  title:  'AkaziConnect — Find Trusted Workers Near You',
  description: 'Connect with skilled workers in Rwanda instantly.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('theme') === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
        <ThemeProvider>
          <LangProvider>
          <AuthProvider>
            <SocketProvider>
              <NotificationProvider>
                <Navbar />
                {children}
              </NotificationProvider>
            </SocketProvider>
          </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
