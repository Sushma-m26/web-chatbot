import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const font = Instrument_Sans({ subsets: ["latin"] });

export const metadata = {
  title: "Frontend mentor",
  description: "A chatbot with conversation memory, powered by Gemini.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={font.className}>{children}
          <Analytics />
          </body>
    </html>
  );
}