import {PrintButton} from "@/components/print-button";
import {prisma} from "@/lib/prisma";
export default async function QuotationPrintPage({searchParams}:{searchParams:Promise<{ref?:string;email?:string}>}){
 const {ref,email}=await searchParams;
 if(!ref||!email)return <main className="shell" style={{maxWidth:760}}><div className="pagehead"><h1>Quotation lookup</h1><p className="muted">Enter the quotation reference and customer email from the quotation notification.</p></div><form className="panel form" action="/quotation"><label className="field">Quotation reference<input name="ref" required/></label><label className="field">Customer email<input name="email" type="email" required/></label><button className="btn">View quotation</button></form></main>;
 const q=await prisma.quotation.findUnique({where:{reference:ref}});
 if(!q||q.email.toLowerCase()!==email.toLowerCase())return <main className="shell"><div className="panel"><h1>Quotation not found</h1><p className="muted">Check the reference and email address.</p></div></main>;
 return <main className="shell printable-document" style={{maxWidth:850}}>
  <div className="pagehead"><div className="eyebrow">SPORE CYBERNETICS · COMMERCIAL DOCUMENT</div><h1>Quotation <span style={{color:"var(--green)"}}>{q.reference}</span></h1><p className="muted">Prepared {q.createdAt.toLocaleDateString("en-UG")} · {q.validUntil?"Valid until "+q.validUntil.toLocaleDateString("en-UG"):"Validity subject to written confirmation"}</p></div>
  <section className="panel"><div className="row"><h2>QUOTATION</h2><span className="badge">{q.status}</span></div>
   <p><strong>Prepared for:</strong> {q.customerName}</p><p><strong>Email:</strong> {q.email}</p>
   <div className="quotation-description"><strong>Scope / description</strong><p>{q.description}</p></div>
   <div className="row quotation-total"><strong>Quoted amount</strong><h2>{q.currency} {Number(q.amount).toLocaleString("en-UG",{minimumFractionDigits:2,maximumFractionDigits:2})}</h2></div>
   <p className="muted small">This quotation is a commercial estimate and is not a tax invoice or an EFRIS fiscal receipt. Any applicable tax will be stated separately in accordance with the supplier's registration status and applicable law.</p>
   <div className="no-print"><PrintButton/></div>
  </section>
 </main>;
}