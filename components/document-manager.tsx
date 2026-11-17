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
   if(pdfFile.size>10*1024*1024)throw new Error("PDF must not exceed 10 MB.");
   const bytes=new Uint8Array(await pdfFile.arrayBuffer());let binary="";
   for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
   const documentPdfBase64=btoa(binary);
   const sealResponse=await fetch("/spore-authentication-seal.svg");if(!sealResponse.ok)throw new Error("Could not load the official authentication seal.");
   const svgText=await sealResponse.text();const svgBlob=new Blob([svgText],{type:"image/svg+xml"});const sealImage=new Image();const sealUrl=URL.createObjectURL(svgBlob);
   try{await new Promise<void>((resolve,reject)=>{sealImage.onload=()=>resolve();sealImage.onerror=()=>reject(new Error("Could not render authentication seal."));sealImage.src=sealUrl;});}finally{URL.revokeObjectURL(sealUrl);}
   const canvas=document.createElement("canvas");canvas.width=900;canvas.height=900;const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Unable to prepare the seal image.");ctx.drawImage(sealImage,0,0,900,900);const sealPngBase64=canvas.toDataURL("image/png").split(",")[1];
   const res=await fetch("/api/admin/documents",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,expiresAt:form.expiresAt?new Date(form.expiresAt).toISOString():"",documentPdfBase64,sealPngBase64})});
   const data=await res.json();if(!res.ok)throw new Error(data.error||"Could not issue document");
   setCreated(data.document);
   const pdfBytes=Uint8Array.from(atob(data.sealedPdfBase64),ch=>ch.charCodeAt(0));const pdfBlob=new Blob([pdfBytes],{type:"application/pdf"});const downloadUrl=URL.createObjectURL(pdfBlob);const link=document.createElement("a");link.href=downloadUrl;link.download=data.document.reference+"-authenticated.pdf";link.click();window.setTimeout(()=>URL.revokeObjectURL(downloadUrl),30000);
   setForm(p=>({...p,title:"",recipientName:"",recipientEmail:"",documentUrl:""}));setPdfFile(null);
  }catch(e){setError(e instanceof Error?e.message:"Unexpected error");}finally{setBusy(false);}
 }
 const input:React.CSSProperties={width:"100%",padding:12,borderRadius:10,border:"1px solid var(--line,#ccd5e4)",background:"var(--panel,#fff)",color:"inherit"};
 return <section className="panel" style={{padding:22}}><h2>Issue an authenticated PDF</h2><p className="muted small">Upload the final PDF (maximum 10 MB). The official authentication seal and a dedicated live-verification page are appended to the PDF. A SHA-256 fingerprint is calculated from the completed file, which downloads automatically after issuance.</p>
 <form onSubmit={submit} className="grid" style={{gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:14}}>
 {[[ "title","Document title"],["recipientName","Recipient name"],["recipientEmail","Recipient email"],["issuerName","Issuing authority"],["issuerDepartment","Department"],["documentUrl","Document URL (optional)"]].map(([name,label])=><label key={name} className="small">{label}<input name={name} value={form[name as keyof typeof form]} onChange={change} required={["title","recipientName","issuerName"].includes(name)} type={name==="recipientEmail"?"email":"text"} style={input}/></label>)}
 <label className="small">Document type<select name="documentType" value={form.documentType} onChange={change} style={input}>{["Certificate","Invoice","Quotation","Contract","Letter","Receipt","Report","Other"].map(x=><option key={x}>{x}</option>)}</select></label>
 <label className="small">Expiry date (optional)<input name="expiresAt" type="date" value={form.expiresAt} onChange={change} style={input}/></label>
 <label className="small" style={{gridColumn:"1/-1"}}>Original PDF (required, maximum 10 MB)<input type="file" accept="application/pdf,.pdf" onChange={e=>setPdfFile(e.target.files?.[0]||null)} style={{...input,marginTop:6}}/><span className="muted">The final sealed PDF is downloaded to your device and can be checked later on the public verification page.</span></label>
 <div style={{gridColumn:"1/-1"}}><button className="btn" disabled={busy}>{busy?"Sealing and issuing…":"Issue sealed PDF & register"}</button></div></form>
 {error&&<p role="alert" style={{color:"#b42318"}}>{error}</p>}
 {created&&<div role="status" style={{marginTop:18,padding:16,border:"1px solid #159447",borderRadius:12}}><h3>Authenticated PDF issued</h3><p><strong>Reference:</strong> {created.reference}</p><p className="small"><strong>SHA-256:</strong> <code style={{overflowWrap:"anywhere"}}>{created.documentHash}</code></p><p className="small">The sealed PDF has been downloaded. Its final page contains the official seal and the live verification address.</p><a className="btn secondary" href={"/verify?code="+encodeURIComponent(created.reference)} target="_blank" rel="noreferrer">Open live verification record ↗</a></div>}
 </section>
}
