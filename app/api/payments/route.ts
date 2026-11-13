import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {FLUTTERWAVE_CURRENCIES,isPaymentCurrency} from "@/lib/payment-currencies";
const schema=z.object({reference:z.string().min(5).max(80),email:z.string().email(),phone:z.string().min(7).max(24).optional(),provider:z.enum(["FLUTTERWAVE","PESAPAL"])});
const site=()=> (process.env.NEXT_PUBLIC_SITE_URL||"https://spore-cybernetics-platform.spore-cybernetics.workers.dev").replace(/\/$/,"");
const base=()=>process.env.PESAPAL_ENV==="live"?"https://pay.pesapal.com/v3":"https://cybqa.pesapal.com/pesapalv3";
async function pesapalToken(){const key=process.env.PESAPAL_CONSUMER_KEY,secret=process.env.PESAPAL_CONSUMER_SECRET;if(!key||!secret)throw new Error("Pesapal credentials are missing.");const r=await fetch(base()+"/api/Auth/RequestToken",{method:"POST",headers:{"Accept":"application/json","Content-Type":"application/json"},body:JSON.stringify({consumer_key:key,consumer_secret:secret})});const d=await r.json() as any;if(!r.ok||!d.token)throw new Error(d.message||"Pesapal authentication failed.");return d.token as string;}
export async function POST(req:Request){let paymentId:string|undefined;try{
 const v=schema.parse(await req.json());const order=await prisma.order.findUnique({where:{reference:v.reference}});
 if(!order||order.email.toLowerCase()!==v.email.toLowerCase())return NextResponse.json({error:"Order not found. Check the checkout email and reference."},{status:404});
 if(order.status!=="PENDING")return NextResponse.json({error:"This order is not awaiting payment."},{status:409});
 if(!isPaymentCurrency(order.currency))return NextResponse.json({error:"This currency is not enabled for online checkout yet."},{status:400});
 if(v.provider==="FLUTTERWAVE"&&!FLUTTERWAVE_CURRENCIES.has(order.currency as any))return NextResponse.json({error:"Flutterwave does not list this currency for card checkout. Choose Pesapal or contact us."},{status:400});
 const amount=Number(order.total);if(!Number.isFinite(amount)||amount<=0)throw new Error("Invalid order amount.");
 const p=await prisma.payment.create({data:{orderId:order.id,provider:v.provider,amount:order.total,currency:order.currency,status:"PENDING",metadata:{merchantReference:order.reference}}});paymentId=p.id;
 if(v.provider==="FLUTTERWAVE"){
  const secret=process.env.FLW_SECRET_KEY;if(!secret)throw new Error("Flutterwave secret key is missing.");
  const txRef="SPF-"+order.reference+"-"+p.id.slice(-8).toUpperCase();
  const r=await fetch("https://api.flutterwave.com/v3/payments",{method:"POST",headers:{"Authorization":"Bearer "+secret,"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({tx_ref:txRef,amount,currency:order.currency,redirect_url:site()+"/api/payments/flutterwave-callback",customer:{email:order.email,name:order.customerName,phone_number:v.phone||order.phone||""},customizations:{title:"Spore Cybernetics",description:"Order "+order.reference},meta:{order_reference:order.reference,payment_id:p.id}})});
  const d=await r.json() as any;if(!r.ok||d.status!=="success"||!d.data?.link)throw new Error(d.message||"Flutterwave checkout creation failed.");
  await prisma.payment.update({where:{id:p.id},data:{providerReference:txRef,metadata:{merchantReference:order.reference,txRef,checkoutUrl:d.data.link}}});
  return NextResponse.json({checkoutUrl:d.data.link,provider:v.provider},{status:201});
 }
 const ipn=process.env.PESAPAL_IPN_ID;if(!ipn)throw new Error("Pesapal IPN ID is missing. Register the callback URL in Pesapal first.");
 const token=await pesapalToken(),merchantRef="SPP-"+p.id,[first,...last]=order.customerName.trim().split(/\s+/);
 const r=await fetch(base()+"/api/Transactions/SubmitOrderRequest",{method:"POST",headers:{"Authorization":"Bearer "+token,"Accept":"application/json","Content-Type":"application/json"},body:JSON.stringify({id:merchantRef,currency:order.currency,amount,description:"Spore Cybernetics order "+order.reference,callback_url:site()+"/api/payments/pesapal-callback",cancellation_url:site()+"/payment?ref="+encodeURIComponent(order.reference),notification_id:ipn,redirect_mode:"TOP_WINDOW",billing_address:{email_address:order.email,phone_number:v.phone||order.phone||"",country_code:"UG",first_name:first,last_name:last.join(" ")||first}})});
 const d=await r.json() as any;if(!r.ok||!d.redirect_url||!d.order_tracking_id)throw new Error(d.message||d.error?.message||"Pesapal checkout creation failed.");
 await prisma.payment.update({where:{id:p.id},data:{providerReference:d.order_tracking_id,metadata:{merchantReference:order.reference,pesapalMerchantReference:merchantRef,checkoutUrl:d.redirect_url}}});
 return NextResponse.json({checkoutUrl:d.redirect_url,provider:v.provider},{status:201});
 }catch(e){if(paymentId)await prisma.payment.update({where:{id:paymentId},data:{status:"FAILED"}}).catch(()=>{});const msg=e instanceof z.ZodError?"Enter valid checkout details and choose a payment provider.":e instanceof Error?e.message:"Unable to start payment.";return NextResponse.json({error:msg},{status:e instanceof z.ZodError?400:502});}}
