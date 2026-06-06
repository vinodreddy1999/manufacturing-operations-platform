import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Manufacturing Operations Platform",
  description: "Modular manufacturing operations SaaS console",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
