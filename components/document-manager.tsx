"use client";
import {useState} from "react";
type IssuedDocument={reference:string;verificationCode:string;documentHash?:string|null};
export function DocumentManager(){
 const [form,setForm]=useState({title:"",documentType:"Certificate",recipientName:"",recipientEmail:"",issuerName:"Spore Cybernetics",issuerDepartment:"",expiresAt:"",documentUrl:""});
 const [pdfFile,setPdfFile]=useState<File|null>(null);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [created,setCreated]=useState<IssuedDocument|null>(null);
 function change(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>){setForm(p=>({...p,[e.target.name]:e.target.value}));}
 async function submit(e:React.FormEvent){
  e.preventDefault();setBusy(true);setError("");setCreated(null);
  try{
   if(!pdfFile)throw new Error("Upload the final PDF. The authentication seal is embedded before issuance.");
   let documentPdfBase64:string;
   {
    if(pdfFile.size>10*1024*1024)throw new Error("PDF must not exceed 10 MB.");
    const bytes=new Uint8Array(await pdfFile.arrayBuffer());let binary="";
    for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    documentPdfBase64=btoa(binary);
   }
   const sealResponse=await fetch("/spore-authentication-seal.svg");if(!sealResponse.ok)throw new Error("Could not load the official authentication seal.");
   const svgText=await sealResponse.text();const svgBlob=new Blob([svgText],{type:"image/svg+xml"});const sealImage=new Image();const sealUrl=URL.createObjectURL(svgBlob);
   try{await new Promise<void>((resolve,reject)=>{sealImage.onload=()=>resolve();sealImage.onerror=()=>reject(new Error("Could not render authentication seal."));sealImage.src=sealUrl;});}finally{URL.revokeObjectURL(sealUrl);}
   const canvas=document.createElement("canvas");canvas.width=900;canvas.height=900;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Unable to prepare the seal image.");ctx.drawImage(sealImage,0,0,900,900);const sealPngBase64=canvas.toDataURL("image/png").split(",")[1];
   const res=await fetch("/api/admin/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,expiresAt:form.expiresAt?new Date(form.expiresAt).toISOString():"",documentPdfBase64,sealPngBase64})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not issue document");
   setCreated(data.document);const pdfBytes=Uint8Array.from(atob(data.sealedPdfBase64),ch=>ch.charCodeAt(0));const pdfBlob=new Blob([pdfBytes],{type:"application/pdf"});const downloadUrl=URL.createObjectURL(pdfBlob);const link=document.createElement("a");link.href=downloadUrl;link.download=data.document.reference+"-authenticated.pdf";link.click();URL.revokeObjectURL(downloadUrl);setForm(p=>({...p,title:"",recipientName:"",recipientEmail:"",documentUrl:""}));setPdfFile(null);
  }catch(e){setError(e instanceof Error?e.message:"Unexpected error");}finally{setBusy(false);}
 }
 const input:React.CSSProperties={width:"100%",padding:12,borderRadius:10,border:"1px solid var(--line,#ccd5e4)",background:"var(--panel,#fff)",color:"inherit"};
 return <section className="panel" style={{padding:22}}><h2>Issue a verified document</h2><p className="muted small">Creates a unique registry record. Upload the final PDF (maximum 10 MB) to calculate and store its SHA-256 fingerprint at issuance. The original PDF is not retained by this fingerprint-only step.</p>
 <form onSubmit={submit} className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
 {[[ "title","Document title"],["recipientName","Recipient name"],["recipientEmail","Recipient email"],["issuerName","Issuing authority"],["issuerDepartment","Department"],["documentUrl","Document URL (optional)"]].map(([name,label])=><label key={name} className="small">{label}<input name={name} value={form[name as keyof typeof form]} onChange={change} required={["title","recipientName","issuerName"].includes(name)} type={name==="recipientEmail"?"email":"text"} style={input}/></label>)}
 <label className="small">Document type<select name="documentType" value={form.documentType} onChange={change} style={input}>{["Certificate","Invoice","Quotation","Contract","Letter","Receipt","Report","Other"].map(x=><option key={x}>{x}</option>)}</select></label>
 <label className="small">Expiry date (optional)<input name="expiresAt" type="date" value={form.expiresAt} onChange={change} style={input}/></label>
 <label className="small" style={{gridColumn:"1/-1"}}>Original PDF to authenticate (required, max 10 MB)<input type="file" accept="application/pdf,.pdf" onChange={e=>setPdfFile(e.target.files?.[0]||null)} style={{...input,marginTop:6}}/><span className="muted">The official seal and verification page are appended to the PDF. Its final fingerprint is recorded for later comparison.</span></label>
 <div style={{gridColumn:"1/-1"}}><button className="btn" disabled={busy}>{busy?"Issuing…":"Issue document & generate QR"}</button></div></form>
 {error&&<p role="alert" style={{color:"#b42318"}}>{error}</p>}
 {created&&<div style={{marginTop:18,padding:16,border:"1px solid #159447",borderRadius:12}}>
 <style>{`@media print{body *{visibility:hidden!important}#auth-stamp,#auth-stamp *{visibility:visible!important}#auth-stamp{position:absolute;left:0;top:0;width:100%;box-shadow:none!important}.no-print{display:none!important}}`}</style>
 <div id="auth-stamp" style={{display:"flex",alignItems:"center",gap:20,flexWrap:"wrap",background:"#fff",color:"#123",padding:16,borderRadius:12}}><img src="/spore-authentication-seal.svg" alt="Spore Cybernetics authentication seal" width="150" height="150"/><div><h3 style={{color:"#123"}}>DOCUMENT AUTHENTICATED</h3><p><strong>Reference:</strong> {created.reference}</p><p style={{overflowWrap:"anywhere"}}><strong>Verify:</strong> {typeof window!=="undefined"?window.location.origin:""}/verify?code={created.reference}</p><img alt="Scannable QR code for document verification" width="150" height="150" src={"https://api.qrserver.com/v1/create-qr-code/?size=180x180&data="+encodeURIComponent(typeof window!=="undefined"?window.location.origin+"/verify?code="+created.reference:"/verify?code="+created.reference)}/></div></div>
 {created.documentHash&&<p className="small"><strong>SHA-256 fingerprint:</strong> <code style={{overflowWrap:"anywhere"}}>{created.documentHash}</code></p>}
 <div className="no-print" style={{display:"flex",gap:10,marginTop:12}}><a className="btn secondary" href={"/verify?code="+encodeURIComponent(created.reference)} target="_blank" rel="noreferrer">Open verification page ↗</a><button className="btn" type="button" onClick={()=>window.print()}>Print authentication seal</button></div>
 <p className="small muted">The authenticated PDF was downloaded. Its last page contains the official seal, document reference and live verification URL. The SHA-256 fingerprint applies to this final sealed PDF.</p>
 </div>}
 </section>
}
