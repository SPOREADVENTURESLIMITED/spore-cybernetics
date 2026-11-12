import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
export const metadata: Metadata = { title: "Spore Cybernetics | Technology for What's Next", description: "End-to-end ICT services, software, infrastructure, cloud, cybersecurity and digital commerce in Uganda and worldwide." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><SiteNav/>{children}<footer className="footer shell"><div>© {new Date().getFullYear()} Spore Cybernetics. All rights reserved.</div><div>Uganda · East Africa · Worldwide</div><div>Technology for what’s next.</div></footer></body></html>; }
