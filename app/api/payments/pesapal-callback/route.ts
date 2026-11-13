import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
const site=()=> (process.env.NEXT_PUBLIC_SITE_URL||"https://spore-cybernetics-platform.spore-cybernetics.workers.dev").replace(/\/$/,"");
const base=()=>process.env.PESAPAL_ENV==="live"?"https://pay.pesapal.com/v3":"https://cybqa.pesapal.com/pesapalv3";
async function check(trackingId:string,merchantReference?:string){
 const key=process.env.PESAPAL_CONSUMER_KEY,secret=process.env.PESAPAL_CONSUMER_SECRET;if(!key||!secret)throw new Error("Pesapal credentials missing.");
 const auth=await fetch(base()+"/api/Auth/RequestToken",{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},body:JSON.stringify({consumer_key:key,consumer_secret:secret})});
 const ad=await auth.json() as any;if(!auth.ok||!ad.token)throw new Error("Pesapal authentication failed.");
 const r=await fetch(base()+"/api/Transactions/GetTransactionStatus?orderTrackingId="+encodeURIComponent(trackingId),{headers:{Authorization:"Bearer "+ad.token,Accept:"application/json"}});
 const d=await r.json() as any;if(!r.ok)throw new Error("Pesapal status check failed.");
 const p=await prisma.payment.findFirst({where:{provider:"PESAPAL",providerReference:trackingId},include:{order:true}});
 if(!p|| (merchantReference&&merchantReference!==(p.metadata as any)?.pesapalMerchantReference))return null;
 const complete=d.payment_status_description==="COMPLETED"&&d.currency===p.currency&&Number(d.amount)>=Number(p.amount);
 if(complete){await prisma.$transaction([prisma.payment.update({where:{id:p.id},data:{status:"SUCCESS",paidAt:new Date(),metadata:{...(p.metadata as any||{}),pesapalStatus:d.payment_status_description,confirmationCode:d.confirmation_code||null}}}),prisma.order.update({where:{id:p.orderId},data:{status:"CONFIRMED"}})]);return p.order.reference;}
 if(["FAILED","REVERSED","INVALID"].includes(d.payment_status_description||""))await prisma.payment.update({where:{id:p.id},data:{status:"FAILED",metadata:{...(p.metadata as any||{}),pesapalStatus:d.payment_status_description}}});
 return null;
}
export async function GET(req:Request){
 const u=new URL(req.url),tracking=u.searchParams.get("OrderTrackingId"),merchant=u.searchParams.get("OrderMerchantReference"),type=u.searchParams.get("OrderNotificationType");
 if(!tracking)return NextResponse.redirect(site()+"/payment?status=verification-pending");
 try{const ref=await check(tracking,merchant||undefined);if(type==="IPNCHANGE")return NextResponse.json({received:true,verified:!!ref});return NextResponse.redirect(site()+"/payment?ref="+encodeURIComponent(ref||"")+"&status="+(ref?"paid":"pending"))}catch{if(type==="IPNCHANGE")return NextResponse.json({error:"Unable to verify notification."},{status:503});return NextResponse.redirect(site()+"/payment?status=verification-pending")}
}
export async function POST(req:Request){
 try{const b=await req.json() as any;const tracking=String(b.OrderTrackingId||"");if(!tracking)return NextResponse.json({error:"Missing tracking ID."},{status:400});const ref=await check(tracking,b.OrderMerchantReference?String(b.OrderMerchantReference):undefined);return NextResponse.json({received:true,verified:!!ref})}catch{return NextResponse.json({error:"Unable to verify notification."},{status:503})}
}
