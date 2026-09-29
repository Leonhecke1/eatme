import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "EatMe", template: "%s | EatMe" },
  description: "Veganer Kalorien-Tracker und Ernährungsplaner mit Budget und Einkaufsliste.",
  applicationName: "EatMe",
  appleWebApp: { capable: true, title: "EatMe", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f5faf6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
