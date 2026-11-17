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
 return <html lang="en"><body><SiteNav/><PwaInstallButton/>{children}<footer className="footer shell"><div>© {new Date().getFullYear()} Spore Cybernetics. All rights reserved.</div><div>{content?.address||"Uganda · East Africa · Worldwide"} · <a href={"mailto:"+email}>{email}</a></div><div><Link href="/#contact">Contact</Link> · <Link href="/services">Services</Link></div></footer></body></html>;
}
## Document authentication and verification

The administrator-only document registry is available at `/admin/documents`. It issues unique references and opaque verification tokens, supports optional expiry dates and document links, and allows administrators to revoke records with a reason. Public verification is available at `/verify`; each issued record can be checked by its reference or unique verification token.

The Spore Cybernetics authentication seal is served from `/spore-authentication-seal.svg`. After issuing a record, administrators can print the seal with its QR code and attach it to the final document. The QR points to the current site's public verification page and contains only the document reference. QR image rendering currently uses the external QR Server image endpoint; only the public verification URL is sent to that service.

After adding the Prisma model, apply the schema to the configured PostgreSQL database and regenerate the Prisma client before deploying:

```bash
npx prisma db push
npx prisma generate
npm run build
```

Do not describe a document as verified until the public verification page confirms its active registry record. A printed seal/QR image by itself is not a cryptographic signature of the PDF contents. For stronger tamper evidence, add server-side PDF storage, SHA-256 hash capture at issuance, signed issuance events, and immutable audit logging before treating this as a legal-grade e-signature service.
