import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { MobileNav } from "@/components/mobile-nav";
export async function SiteNav(){
 const user=await getCurrentUser();
 const accountHref=user?(user.role==="ADMIN"?"/admin":"/portal"):"/login";
 const accountLabel=user?(user.role==="ADMIN"?"Admin dashboard":"My account"):"Client login";
 return <header className="shell nav"><Link href="/" className="brand brand-image"><img src="/icon.svg" alt="Spore Cybernetics" /><span className="brand-wordmark"><strong>SPORE</strong><small>CYBERNETICS</small></span></Link><nav className="navlinks" aria-label="Main navigation"><Link href="/services">Services</Link><Link href="/shop">Shop</Link><a href="/#about">About</a><a href="/#contact">Contact</a></nav><div className="desktop-actions"><Link className="btn secondary" href={accountHref}>{accountLabel}</Link><Link className="btn" href="/#contact">Get a solution ↗</Link></div><MobileNav accountHref={accountHref} accountLabel={accountLabel}/></header>;
}
