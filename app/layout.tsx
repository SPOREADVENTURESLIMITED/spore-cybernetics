import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { prisma } from "@/lib/prisma";
export const metadata: Metadata = {title:"Spore Cybernetics | Technology for What's Next",description:"End-to-end ICT services, software, infrastructure, cloud, cybersecurity and digital commerce in Uganda and worldwide.",applicationName:"Spore Cybernetics",manifest:"/manifest.webmanifest",themeColor:"#061a48",icons:{icon:[{url:"/icon.svg",type:"image/svg+xml"}],apple:[{url:"/icon.svg",type:"image/svg+xml"}]},appleWebApp:{capable:true,title:"Spore Cybernetics",statusBarStyle:"black-translucent"}};
export default async function RootLayout({children}:{children:React.ReactNode}) {
 let content:{address:string|null;contactEmail:string|null}|null=null;
 try { content=await prisma.siteContent.findUnique({where:{id:"global"},select:{address:true,contactEmail:true}}); }
 catch(error) { console.error("Unable to load footer site content:",error); }
 const email=content?.contactEmail||"info@sporecybernetics.com";
 return <html lang="en"><body><SiteNav/><PwaInstallButton/>{children}<footer className="footer shell"><div>© {new Date().getFullYear()} Spore Cybernetics. All rights reserved.</div><div>{content?.address||"Uganda · East Africa · Worldwide"} · <a href={"mailto:"+email}>{email}</a></div><div><Link href="/#contact">Contact</Link> · <Link href="/services">Services</Link> · <Link href="/verify">Verify a document</Link> · <Link href="/verify">Verify a document</Link></div></footer></body></html>;
}