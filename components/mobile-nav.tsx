"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

type Props = { accountHref: string; accountLabel: string };
export function MobileNav({accountHref,accountLabel}:Props) {
  const [open,setOpen] = useState(false);
  const close = () => setOpen(false);
  return <>
    <button className="menu-toggle" type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
      {open ? <X size={23}/> : <Menu size={23}/>}
    </button>
    {open && <div className="mobile-panel">
      <Link href="/services" onClick={close}>Services</Link>
      <Link href="/shop" onClick={close}>Shop</Link>
      <Link href="/#about" onClick={close}>About</Link>
      <Link href="/#contact" onClick={close}>Contact</Link>
      <Link href={accountHref} onClick={close}>{accountLabel}</Link>
      <PwaInstallButton/>
      <Link className="btn" href="/#contact" onClick={close}>Get a solution ↗</Link>
    </div>}
  </>;
}