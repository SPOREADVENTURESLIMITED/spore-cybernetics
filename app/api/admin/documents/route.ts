import {NextResponse} from "next/server";
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
 documentUrl:z.string().url().optional().or(z.literal(""))
});
export async function POST(req:Request){
 if(!hasSafeRequestOrigin(req)) return NextResponse.json({error:"Cross-site request rejected."},{status:403});
 const admin=await requireAdmin(); if(!admin) return NextResponse.json({error:"Forbidden"},{status:403});
 try {
  const v=schema.parse(await req.json());
  const reference="SC-"+new Date().getUTCFullYear()+"-"+crypto.randomUUID().replace(/-/g,"").slice(0,12).toUpperCase();
  const document=await prisma.verifiedDocument.create({data:{
   reference,verificationCode:crypto.randomUUID(),title:v.title,documentType:v.documentType,
   recipientName:v.recipientName,recipientEmail:v.recipientEmail||null,
   issuerName:v.issuerName,issuerDepartment:v.issuerDepartment||null,
   expiresAt:v.expiresAt?new Date(v.expiresAt):null,documentUrl:v.documentUrl||null,issuedById:admin.id
  }});
  return NextResponse.json({ok:true,document:{id:document.id,reference:document.reference,verificationCode:document.verificationCode}}, {status:201});
 } catch(error){console.error("Document issuance failed:",error);return NextResponse.json({error:"Unable to issue document. Check the submitted details and database migration."},{status:400});}
}
