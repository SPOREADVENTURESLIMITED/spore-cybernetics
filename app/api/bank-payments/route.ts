import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {hasSafeRequestOrigin} from "@/lib/request-security";
const schema=z.object({reference:z.string().min(5).max(80),email:z.string().email().max(254),methodId:z.string().min(1).max(100),payerName:z.string().trim().min(2).max(140),bankReference:z.string().trim().min(3).max(100)});
export async function POST(req:Request){
 if(!hasSafeRequestOrigin(req))return NextResponse.json({error:"Cross-site request rejected."},{status:403});
 try{
  const x=schema.parse(await req.json());
  const[o,m]=await Promise.all([prisma.order.findUnique({where:{reference:x.reference}}),prisma.paymentMethod.findUnique({where:{id:x.methodId}})]);
  if(!o||o.email.toLowerCase()!==x.email.toLowerCase())return NextResponse.json({error:"Order not found."},{status:404});
  if(o.status!=="PENDING"||!m||!m.enabled||m.category!=="BANK")return NextResponse.json({error:"Order or bank method is unavailable."},{status:400});
  const p=await prisma.payment.create({data:{orderId:o.id,provider:"BANK_TRANSFER",amount:o.total,currency:o.currency,providerReference:x.bankReference,metadata:{paymentMethodId:m.id,bank:m.network,accountName:m.accountName,accountNumber:m.accountNumber,payerName:x.payerName,bankReference:x.bankReference,verification:"AWAITING_ADMIN_VERIFICATION"}}});
  return NextResponse.json({paymentReference:"SPB-"+p.id.slice(-10).toUpperCase(),amount:o.total.toString(),currency:o.currency,status:"PENDING",message:"Transfer details submitted. Payment remains pending until the bank credit is verified by an administrator."},{status:201});
 }catch{return NextResponse.json({error:"Could not submit transfer. Check details and ensure the bank reference is unique."},{status:400});}
}
