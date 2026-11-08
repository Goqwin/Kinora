import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";

import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kinora | Calgary single parents",
    template: "%s | Kinora",
  },
  icons: { icon: "/brand/kinora-mark.svg" },
  description:
    "Kinora helps single parents in Calgary find childcare, financial aid, and community supports. Calm, plain guidance when you need a next step.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-CA"
      suppressHydrationWarning
      className={`${fredoka.variable} ${nunito.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col font-[family-name:var(--font-body)]">
        <ThemeScript />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
