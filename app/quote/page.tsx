import {ContactForm} from "@/components/contact-form";
import {prisma} from "@/lib/prisma";
export default async function QuoteRequestPage(){
 let services:{id:string;name:string}[]=[];
 try{services=await prisma.service.findMany({where:{active:true},select:{id:true,name:true},orderBy:{sortOrder:"asc"}});}catch(error){console.error("Quote request services unavailable",error);}
 return <main className="shell" style={{maxWidth:820}}>
  <div className="pagehead"><div className="eyebrow">PROJECT ESTIMATE · NO OBLIGATION</div><h1>Request a <span style={{color:"var(--green)"}}>quotation.</span></h1><p className="muted">Describe the work you need. Our team will review your requirements and prepare a written quotation. You do not need an account to submit a request.</p></div>
  <ContactForm services={services}/>
  <p className="muted small">Submitting this form is a request for an estimate, not an order or a tax invoice. Tax treatment will be shown transparently on any quotation issued.</p>
 </main>;
}