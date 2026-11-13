import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
const site=()=> (process.env.NEXT_PUBLIC_SITE_URL||"https://spore-cybernetics-platform.spore-cybernetics.workers.dev").replace(/\/$/,"");
async function verify(id:string,expectedRef?:string){
 const secret=process.env.FLW_SECRET_KEY;if(!secret)throw new Error("Flutterwave secret is not configured.");
 const r=await fetch("https://api.flutterwave.com/v3/transactions/"+encodeURIComponent(id)+"/verify",{headers:{Authorization:"Bearer "+secret,Accept:"application/json"}});
 const d=await r.json() as any;if(!r.ok||d.status!=="success"||!d.data)return null;
 const tx=d.data;const ref=expectedRef||tx.tx_ref;const p=await prisma.payment.findFirst({where:{provider:"FLUTTERWAVE",providerReference:ref},include:{order:true}});
 if(!p||tx.status!=="successful"||tx.tx_ref!==p.providerReference||tx.currency!==p.currency||Number(tx.amount)<Number(p.amount))return null;
 await prisma.$transaction([prisma.payment.update({where:{id:p.id},data:{status:"SUCCESS",paidAt:new Date(),metadata:{...(p.metadata as any||{}),verifiedTransactionId:String(tx.id),verifiedAt:new Date().toISOString()}}}),prisma.order.update({where:{id:p.orderId},data:{status:"CONFIRMED"}})]);
 return p.order.reference;
}
export async function GET(req:Request){
 const u=new URL(req.url),id=u.searchParams.get("transaction_id"),txRef=u.searchParams.get("tx_ref");
 if(!id||!txRef)return NextResponse.redirect(site()+"/payment?status=verification-pending");
 try{const ref=await verify(id,txRef);return NextResponse.redirect(site()+"/payment?ref="+encodeURIComponent(ref||"")+"&status="+(ref?"paid":"pending"))}catch{return NextResponse.redirect(site()+"/payment?status=verification-pending")}
}
