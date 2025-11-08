import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "../components/theme/ThemeProvider";
import "./globals.css";
import QueryProvider from "@/lib/query";
import Header from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata = {
  title: "Unified Box",
  description: "",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Match browser UI to theme */}
        <meta
          name="theme-color"
          content="#ffffff"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#0B0F19"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className={`${inter.variable} ${mono.variable} antialiased`}>
        <ThemeProvider>
          <QueryProvider>
            <Header />
            <div className="pt-16">{children}</div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
