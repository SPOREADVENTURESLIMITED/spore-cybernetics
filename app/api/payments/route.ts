import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";

const schema=z.object({
  reference:z.string().min(5).max(80),
  email:z.string().email(),
  phone:z.string().min(9).max(20),
  merchantCode:z.enum(["26555826","46686721"])
});

export async function POST(req:Request){
  try{
    const input=schema.parse(await req.json());
    const order=await prisma.order.findUnique({where:{reference:input.reference},include:{payments:{where:{status:"PENDING"},orderBy:{createdAt:"desc"},take:1}}});
    if(!order || order.email.toLowerCase()!==input.email.toLowerCase()) return NextResponse.json({error:"Order not found. Check the order reference and checkout email."},{status:404});
    if(order.status!=="PENDING") return NextResponse.json({error:"This order is no longer awaiting payment."},{status:409});
    const payment=await prisma.payment.create({data:{
      orderId:order.id,provider:"MTN_MOMO_MERCHANT_CODE",amount:order.total,currency:order.currency,status:"PENDING",
      metadata:{merchantName:"SPORE ADVENTURES LIMITED",merchantCode:input.merchantCode,network:"MTN",payerPhone:input.phone,mode:"MANUAL_MERCHANT_CODE",verification:"NOT_VERIFIED"}
    }});
    return NextResponse.json({paymentReference:"SPM-"+payment.id.slice(-10).toUpperCase(),merchantName:"SPORE ADVENTURES LIMITED",merchantCode:input.merchantCode,amount:order.total.toString(),currency:order.currency,status:"PENDING",instructions:["On your MTN phone, open the MoMo menu or dial *165#.","Choose the option for paying a merchant / goods and services.","Enter the merchant code shown below.","Enter the exact order amount and confirm the merchant name before entering your MoMo PIN.","Keep the MTN confirmation message and transaction ID for verification."],message:"This is a manual merchant-code payment instruction. The website cannot receive an automatic MTN confirmation until the official MTN Collections API is connected."},{status:201});
  }catch(e){
    if(e instanceof z.ZodError) return NextResponse.json({error:"Please provide a valid order reference, checkout email, phone number and merchant code."},{status:400});
    return NextResponse.json({error:"Unable to prepare payment. Please try again."},{status:500});
  }
}
