"use client";
import {useState} from "react";
export function QuotationResponse({id}:{id:string}){
 const[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function respond(action:"accept"|"decline"){
  if(action==="decline"&&!window.confirm("Decline this quotation?"))return;
  setBusy(true);setMessage("");
  try{
   const r=await fetch("/api/quotations/"+encodeURIComponent(id),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
   const d=await r.json();
   if(!r.ok)throw new Error(d.error||"Unable to update quotation.");
   if(action==="accept"){window.location.assign(d.invoiceUrl||("/invoice?ref="+encodeURIComponent(d.reference)));return;}
   setMessage("Quotation declined.");
   window.location.reload();
  }catch(e){setMessage(e instanceof Error?e.message:"Unable to update quotation.");}
  finally{setBusy(false);}
 }
 return <div className="row" style={{flexWrap:"wrap",marginTop:12}}>
  <button className="btn" type="button" disabled={busy} onClick={()=>respond("accept")}>{busy?"Please wait…":"Accept & create invoice"}</button>
  <button className="btn secondary" type="button" disabled={busy} onClick={()=>respond("decline")}>Decline</button>
  {message&&<p className="muted small" role="status">{message}</p>}
 </div>;
}
