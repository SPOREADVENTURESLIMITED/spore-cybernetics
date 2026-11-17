import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";

export const runtime = "edge";

export async function POST(req:Request){
 try{
  const form=await req.formData();
  const reference=String(form.get("reference")||"").trim();
  const file=form.get("file");
  if(!reference||!(file instanceof File))return NextResponse.json({error:"A document reference and PDF file are required."},{status:400});
  if(file.size<8||file.size>10*1024*1024)return NextResponse.json({error:"PDF must be between 8 bytes and 10 MB."},{status:413});
  if(file.type&&file.type!=="application/pdf"&&!file.name.toLowerCase().endsWith(".pdf"))return NextResponse.json({error:"Only PDF files can be checked."},{status:415});
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-")return NextResponse.json({error:"The uploaded file is not a valid PDF."},{status:415});
  const digest=await crypto.subtle.digest("SHA-256",bytes);
  const fingerprint=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
  const doc=await prisma.verifiedDocument.findFirst({where:{OR:[{reference:reference.toUpperCase()},{verificationCode:reference}]}});
  if(!doc||!doc.documentHash)return NextResponse.json({match:false,reason:"NO_FINGERPRINT",message:"This registry record has no stored PDF fingerprint. Reference verification remains available."});
  let diff=0;for(let i=0;i<fingerprint.length;i++)diff|=fingerprint.charCodeAt(i)^(doc.documentHash.charCodeAt(i)||0);
  const same=diff===0&&fingerprint.length===doc.documentHash.length;
  const expired=!!doc.expiresAt&&doc.expiresAt<new Date();
  const active=doc.status==="ACTIVE"&&!expired;
  return NextResponse.json({match:same&&active,integrityMatch:same,registryStatus:doc.status,expired,reason:!same?"FINGERPRINT_MISMATCH":!active?"NOT_ACTIVE":"MATCH",message:!same?"The uploaded PDF does not match the file fingerprint recorded at issuance.":!active?"The PDF matches the recorded file, but the registry record is not currently active.":"The PDF fingerprint matches the file recorded by Spore Cybernetics and the registry record is active."});
 }catch(error){console.error("PDF integrity verification failed:",error);return NextResponse.json({error:"Unable to verify this PDF."},{status:400});}
}
