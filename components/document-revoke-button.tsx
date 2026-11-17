"use client";
import {useState} from "react";
export function DocumentRevokeButton({id}:{id:string}){
 const [busy,setBusy]=useState(false);
 async function revoke(){const reason=window.prompt("Reason for revoking this document (required):");if(!reason||reason.trim().length<5)return;setBusy(true);try{const r=await fetch("/api/admin/documents/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({reason})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not revoke document");window.location.reload();}catch(e){window.alert(e instanceof Error?e.message:"Unable to revoke");}finally{setBusy(false);}}
 return <button type="button" className="btn secondary" disabled={busy} onClick={revoke}>{busy?"Revoking…":"Revoke"}</button>;
}
