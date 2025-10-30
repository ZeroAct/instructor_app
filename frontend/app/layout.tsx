import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Instructor App - Structured LLM Outputs",
  description: "Create structured outputs from LLMs with dynamic schemas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
