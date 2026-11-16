import Link from "next/link";
import {AuthForm} from "@/components/auth-form";
export default function AdminLogin(){return <main className="shell" style={{maxWidth:520}}>
 <div className="pagehead"><div className="eyebrow">SPORE CYBERNETICS · STAFF ACCESS</div><h1>Admin <span style={{color:"var(--green)"}}>sign in.</span></h1><p className="muted">Restricted access for authorised administrators. Customer accounts cannot access the control centre.</p></div>
 <AuthForm mode="login" adminOnly/>
 <p className="muted small"><Link href="/login" style={{color:"var(--green)"}}>Return to customer login</Link></p>
 </main>}