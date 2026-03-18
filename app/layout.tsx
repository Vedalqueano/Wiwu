import type { Metadata } from "next";
import { Sora, DM_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "WiWU Flow",
  description: "Plataforma corporativa para centralizar comunicação, gestão e cultura.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${dmMono.variable} font-[family-name:var(--font-sora)] antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

