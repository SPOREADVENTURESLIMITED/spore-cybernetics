import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {hasSafeRequestOrigin} from "@/lib/request-security";

const secureDocumentUrl=z.string().url().refine((value)=>{
 try{return new URL(value).protocol==="https:";}catch{return false;}
},{message:"Document URLs must use HTTPS."});

const schema=z.object({
 title:z.string().trim().min(2).max(180),
 documentType:z.string().trim().min(2).max(80),
 recipientName:z.string().trim().min(2).max(140),
 recipientEmail:z.string().trim().email().max(254).optional().or(z.literal("")),
 issuerName:z.string().trim().min(2).max(140),
 issuerDepartment:z.string().trim().max(100).optional(),
 expiresAt:z.string().datetime().optional().or(z.literal("")),
 documentUrl:secureDocumentUrl.optional().or(z.literal("")),
 documentPdfBase64:z.string().max(14_000_000).optional()
});
export async function POST(req:Request){
 if(!hasSafeRequestOrigin(req)) return NextResponse.json({error:"Cross-site request rejected."},{status:403});
 const admin=await requireAdmin(); if(!admin) return NextResponse.json({error:"Forbidden"},{status:403});
 try {
  const v=schema.parse(await req.json());
  let documentHash:string|null=null;
  if(v.documentPdfBase64){
   const binary=atob(v.documentPdfBase64);if(binary.length>10*1024*1024)throw new Error("PDF exceeds the 10 MB limit.");
   const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
   if(new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-")throw new Error("Uploaded file is not a valid PDF.");
   const digest=await crypto.subtle.digest("SHA-256",bytes);
   documentHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  }
  const reference="SC-"+new Date().getUTCFullYear()+"-"+crypto.randomUUID().replace(/-/g,"").slice(0,24).toUpperCase();
  const document=await prisma.verifiedDocument.create({data:{
   reference,verificationCode:crypto.randomUUID(),title:v.title,documentType:v.documentType,
   recipientName:v.recipientName,recipientEmail:v.recipientEmail||null,
   issuerName:v.issuerName,issuerDepartment:v.issuerDepartment||null,
   expiresAt:v.expiresAt?new Date(v.expiresAt):null,documentUrl:v.documentUrl||null,documentHash,issuedById:admin.id
  }});
  return NextResponse.json({ok:true,document:{id:document.id,reference:document.reference,verificationCode:document.verificationCode,documentHash:document.documentHash}}, {status:201});
 } catch(error){console.error("Document issuance failed:",error);return NextResponse.json({error:"Unable to issue document. Check the submitted details and database migration."},{status:400});}
}
