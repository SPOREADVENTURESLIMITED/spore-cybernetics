import {redirect} from "next/navigation";
import {getCurrentUser} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {DocumentManager} from "@/components/document-manager";
import {DocumentRevokeButton} from "@/components/document-revoke-button";
export const dynamic="force-dynamic";
export default async function DocumentsAdmin(){
 const user=await getCurrentUser();if(!user||user.role!=="ADMIN")redirect("/admin/login");
 const rows=await prisma.verifiedDocument.findMany({orderBy:{createdAt:"desc"},take:100});
 return <main className="shell"><div className="pagehead"><div className="eyebrow">CENTRAL ADMINISTRATION · TRUST SERVICES</div><h1>Document <span style={{color:"var(--green)"}}>registry.</span></h1><p className="muted">Issue verifiable document records, generate unique QR verification links and revoke compromised or superseded documents.</p></div><DocumentManager/><div className="panel" style={{marginTop:24,padding:16,overflowX:"auto"}}><h2>Issued documents</h2><table className="table"><thead><tr><th>Reference</th><th>Document</th><th>Recipient</th><th>Issued</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(d=><tr key={d.id}><td>{d.reference}</td><td>{d.title}<br/><small className="muted">{d.documentType}</small></td><td>{d.recipientName}</td><td>{d.issuedAt.toLocaleDateString("en-GB")}</td><td>{d.status==="ACTIVE"&&(!d.expiresAt||d.expiresAt>new Date())?"ACTIVE":d.status==="REVOKED"?"REVOKED":"EXPIRED"}</td><td><a href={"/verify?code="+encodeURIComponent(d.reference)} target="_blank" rel="noreferrer">Verify ↗</a>{d.status==="ACTIVE"&&<div style={{marginTop:8}}><DocumentRevokeButton id={d.id}/></div>}</td></tr>)}</tbody></table>{rows.length===0&&<p className="muted">No documents issued yet.</p>}</div></main>
}
