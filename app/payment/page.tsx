import {prisma} from "@/lib/prisma";
import {PaymentInitiator} from "@/components/payment-initiator";
export default async function PaymentPage({searchParams}:{searchParams:Promise<{ref?:string}>}){
 const{ref}=await searchParams;
 if(!ref)return <main className="shell" style={{maxWidth:700}}><div className="pagehead"><div className="eyebrow">PAYMENT</div><h1>Order reference required.</h1><p className="muted">Open the payment link from your checkout confirmation.</p></div></main>;
 const order=await prisma.order.findUnique({where:{reference:ref},select:{reference:true,total:true,currency:true,status:true}});
 if(!order)return <main className="shell" style={{maxWidth:700}}><div className="panel"><h1>Order not found</h1><p className="muted">Check the order reference or contact our team.</p><a className="btn secondary" href="/shop">Return to shop</a></div></main>;
 return <main className="shell" style={{maxWidth:760}}><div className="pagehead"><div className="eyebrow">SPORE CYBERNETICS · SECURE PAYMENTS</div><h1>Complete your <span style={{color:"var(--green)"}}>payment.</span></h1><p className="muted">Order {order.reference} · {order.currency} {Number(order.total).toLocaleString()}</p></div>{order.status!=="PENDING"?<div className="panel"><h2>Order status: {order.status}</h2><p className="muted">This order is not currently awaiting payment.</p></div>:<PaymentInitiator reference={order.reference} currency={order.currency}/>}<p className="muted small" style={{marginTop:18}}>Available online gateways: Flutterwave and Pesapal. Payment methods and currency acceptance depend on your merchant account and provider country settings.</p></main>;
}
