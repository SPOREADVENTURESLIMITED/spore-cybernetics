import {redirect} from "next/navigation";
import Link from "next/link";
import {getCurrentUser} from "@/lib/auth";
import {AdminPaymentMethods} from "@/components/admin-payment-methods";
export default async function PaymentMethodsAdmin(){const user=await getCurrentUser();if(!user||user.role!=="ADMIN")redirect("/login");return <main className="shell"><div className="pagehead"><div className="eyebrow">CENTRAL ADMINISTRATION</div><h1>Payment methods.</h1><p className="muted">Manage mobile money, bank accounts, gateways and other payment instructions.</p><Link className="btn secondary" href="/admin">Back to dashboard</Link></div><AdminPaymentMethods/></main>}