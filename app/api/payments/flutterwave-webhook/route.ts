import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
export async function POST(req:Request){
 const raw=await req.text(),secretHash=process.env.FLW_SECRET_HASH,legacy=req.headers.get("verif-hash"),signature=req.headers.get("flutterwave-signature");
 if(!secretHash)return NextResponse.json({error:"Webhook secret is not configured."},{status:503});
 let valid=!!legacy&&legacy===secretHash;
 if(!valid&&signature){const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secretHash),{name:"HMAC",hash:"SHA-256"},false,["sign"]);const digest=await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(raw));const expected=btoa(String.fromCharCode(...new Uint8Array(digest)));valid=expected===signature;}
 if(!valid)return NextResponse.json({error:"Invalid webhook signature."},{status:401});
 try{
  const payload=JSON.parse(raw),id=String(payload?.data?.id||"");if(!id)return NextResponse.json({received:true});
  const secret=process.env.FLW_SECRET_KEY;if(!secret)return NextResponse.json({error:"Gateway secret is not configured."},{status:503});
  const vr=await fetch("https://api.flutterwave.com/v3/transactions/"+encodeURIComponent(id)+"/verify",{headers:{Authorization:"Bearer "+secret,Accept:"application/json"}});
  const vd=await vr.json() as any,tx=vd?.data;if(!vr.ok||vd.status!=="success"||!tx)return NextResponse.json({error:"Could not verify transaction."},{status:502});
  const p=await prisma.payment.findFirst({where:{provider:"FLUTTERWAVE",providerReference:String(tx.tx_ref)},include:{order:true}});
  if(!p||tx.status!=="successful"||tx.currency!==p.currency||Number(tx.amount)<Number(p.amount))return NextResponse.json({received:true,verified:false});
  await prisma.$transaction([prisma.payment.update({where:{id:p.id},data:{status:"SUCCESS",paidAt:new Date(),metadata:{...(p.metadata as any||{}),verifiedTransactionId:String(tx.id)}}}),prisma.order.update({where:{id:p.orderId},data:{status:"CONFIRMED"}})]);
  return NextResponse.json({received:true,verified:true});
 }catch{return NextResponse.json({error:"Webhook processing failed."},{status:500})}
}
