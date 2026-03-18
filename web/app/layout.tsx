import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { signIn, signOut } from "@/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Health Monitor",
  description: "Log and track your daily health events",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="flex items-center justify-between px-6 py-3 border-b text-sm">
          <span className="font-medium">Health Monitor</span>
          {session?.user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-500">{session.user.email}</span>
              <form action={async () => { "use server"; await signOut(); }}>
                <button className="text-gray-500 hover:text-black transition">Sign out</button>
              </form>
            </div>
          ) : (
            <form action={async () => { "use server"; await signIn("google"); }}>
              <button className="px-4 py-1.5 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition">
                Sign in with Google
              </button>
            </form>
          )}
        </header>
        {session?.user ? children : (
          <div className="flex items-center justify-center min-h-[80vh]">
            <p className="text-gray-400">Sign in to access your health log.</p>
          </div>
        )}
      </body>
    </html>
  );
}
