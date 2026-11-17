import {NextResponse} from "next/server";
import {PDFDocument,StandardFonts,rgb} from "pdf-lib";
import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {hasSafeRequestOrigin} from "@/lib/request-security";

const schema=z.object({
 title:z.string().trim().min(2).max(180),
 documentType:z.string().trim().min(2).max(80),
 recipientName:z.string().trim().min(2).max(140),
 recipientEmail:z.string().trim().email().max(254).optional().or(z.literal("")),
 issuerName:z.string().trim().min(2).max(140),
 issuerDepartment:z.string().trim().max(100).optional(),
 expiresAt:z.string().datetime().optional().or(z.literal("")),
 documentUrl:z.string().url().refine(v=>new URL(v).protocol==="https:").optional().or(z.literal("")),
 documentPdfBase64:z.string().min(1).max(14_000_000),
 sealPngBase64:z.string().min(1).max(2_000_000)
});
export const runtime="edge";
export async function POST(req:Request){
 if(!hasSafeRequestOrigin(req))return NextResponse.json({error:"Cross-site request rejected."},{status:403});
 const admin=await requireAdmin();if(!admin)return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const v=schema.parse(await req.json());
  const raw=atob(v.documentPdfBase64);if(raw.length>10*1024*1024)throw new Error("PDF exceeds 10 MB.");
  const original=Uint8Array.from(raw,c=>c.charCodeAt(0));
  if(new TextDecoder().decode(original.slice(0,5))!=="%PDF-")throw new Error("Uploaded file is not a valid PDF.");
  const sealRaw=atob(v.sealPngBase64);const sealBytes=Uint8Array.from(sealRaw,c=>c.charCodeAt(0));
  if(sealBytes[0]!==137||sealBytes[1]!==80||sealBytes[2]!==78||sealBytes[3]!==71)throw new Error("Authentication seal image is invalid.");
  const reference="SC-"+new Date().getUTCFullYear()+"-"+crypto.randomUUID().replace(/-/g,"").slice(0,24).toUpperCase();
  const verificationCode=crypto.randomUUID();
  const verificationUrl=new URL("/verify?code="+encodeURIComponent(reference),req.url).toString();
  const pdf=await PDFDocument.load(original,{ignoreEncryption:false});
  const seal=await pdf.embedPng(sealBytes);
  const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular=await pdf.embedFont(StandardFonts.Helvetica);
  const page=pdf.addPage([595.28,841.89]);
  const navy=rgb(0.06,0.20,0.48);const green=rgb(0.08,0.58,0.28);const muted=rgb(0.28,0.34,0.43);
  page.drawText("SPORE CYBERNETICS",{x:64,y:780,size:20,font:bold,color:navy});
  page.drawText("DOCUMENT AUTHENTICATION CERTIFICATE",{x:64,y:750,size:11,font:bold,color:green});
  page.drawLine({start:{x:64,y:733},end:{x:531,y:733},thickness:1,color:navy});
  page.drawImage(seal,{x:203,y:475,width:190,height:190});
  page.drawText("This page is an integral part of the attached original document.",{x:64,y:442,size:10,font:regular,color:muted});
  const rows:[string,string][]=[["Document",v.title],["Document type",v.documentType],["Issued to",v.recipientName],["Issued by",v.issuerName],["Department",v.issuerDepartment||"Not specified"],["Reference",reference],["Date issued",new Date().toISOString().slice(0,10)],["Expiry",v.expiresAt?new Date(v.expiresAt).toISOString().slice(0,10):"No expiry"]];
  let y=400;for(const [label,value] of rows){page.drawText(label.toUpperCase(),{x:64,y,size:7,font:bold,color:muted});page.drawText(value.slice(0,100),{x:185,y:sizeY(y),size:10,font:regular,color:navy});y-=31;}
  page.drawText("LIVE REGISTRY VERIFICATION",{x:64,y:143,size:8,font:bold,color:green});
  page.drawText(verificationUrl,{x:64,y:125,size:8,font:regular,color:navy,maxWidth:465});
  page.drawText("Check the live registry before relying on this document. The registry status may change.",{x:64,y:95,size:8,font:regular,color:muted});
  page.drawLine({start:{x:64,y:75},end:{x:531,y:75},thickness:1,color:navy});
  page.drawText("Spore Cybernetics · Official digital document authentication",{x:64,y:57,size:8,font:regular,color:muted});
  const sealedBytes=await pdf.save();
  const digestInput=new Uint8Array(sealedBytes.length);digestInput.set(sealedBytes);
  const digest=await crypto.subtle.digest("SHA-256",digestInput.buffer);
  const documentHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  const document=await prisma.verifiedDocument.create({data:{reference,verificationCode,title:v.title,documentType:v.documentType,recipientName:v.recipientName,recipientEmail:v.recipientEmail||null,issuerName:v.issuerName,issuerDepartment:v.issuerDepartment||null,expiresAt:v.expiresAt?new Date(v.expiresAt):null,documentUrl:v.documentUrl||null,documentHash,issuedById:admin.id}});
  let binary="";for(let i=0;i<sealedBytes.length;i+=0x8000)binary+=String.fromCharCode(...sealedBytes.subarray(i,i+0x8000));
  return NextResponse.json({ok:true,document:{id:document.id,reference:document.reference,verificationCode:document.verificationCode,documentHash:document.documentHash},sealedPdfBase64:btoa(binary)},{status:201});
 }catch(error){console.error("Document issuance failed:",error);return NextResponse.json({error:error instanceof Error?error.message:"Unable to issue document."},{status:400});}
}
function sizeY(y:number){return y+0.5;}
