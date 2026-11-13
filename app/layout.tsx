import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { prisma } from "@/lib/prisma";
export const metadata: Metadata = {title:"Spore Cybernetics | Technology for What's Next",description:"End-to-end ICT services, software, infrastructure, cloud, cybersecurity and digital commerce in Uganda and worldwide.",applicationName:"Spore Cybernetics",manifest:"/manifest.webmanifest",themeColor:"#061a48",icons:{icon:"/icon.svg",apple:"/icon.svg"},appleWebApp:{capable:true,title:"Spore Cybernetics",statusBarStyle:"black-translucent"}};
export default async function RootLayout({children}:{children:React.ReactNode}) {
 const content=await prisma.siteContent.findUnique({where:{id:"global"}});
 return <html lang="en"><body><SiteNav/>{children}<footer className="footer shell"><div>© {new Date().getFullYear()} Spore Cybernetics. All rights reserved.</div><div>{content?.address||"Uganda · East Africa · Worldwide"} · <a href={"mailto:"+(content?.contactEmail||"info@sporecybernetics.com")}>{content?.contactEmail||"Contact us"}</a></div><div><Link href="/#contact">Contact</Link> · <Link href="/services">Services</Link></div></footer></body></html>;
}