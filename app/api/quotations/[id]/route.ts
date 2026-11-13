import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getCurrentUser} from "@/lib/auth";

export async function POST(req:Request,{params}:{params:Promise<{id:string}>}){
  const user=await getCurrentUser();
  if(!user)return NextResponse.json({error:"Please sign in to respond to this quotation."},{status:401});
  const {id}=await params;
  try{
    const body=await req.json().catch(()=>({}));
    const action=body?.action;
    if(action!=="accept"&&action!=="decline")return NextResponse.json({error:"Choose accept or decline."},{status:400});
    const quote=await prisma.quotation.findUnique({where:{id}});
    if(!quote||quote.email.toLowerCase()!==user.email.toLowerCase()||(quote.userId&&quote.userId!==user.id))return NextResponse.json({error:"Quotation not found."},{status:404});
    if(quote.status==="ACCEPTED"&&quote.orderId&&action==="accept"){
      const order=await prisma.order.findUnique({where:{id:quote.orderId},select:{reference:true}});
      return NextResponse.json({accepted:true,reference:order?.reference});
    }
    if(quote.status!=="SENT")return NextResponse.json({error:"This quotation is no longer available for a response."},{status:409});
    if(quote.validUntil&&quote.validUntil.getTime()<Date.now()){
      await prisma.quotation.updateMany({where:{id,status:"SENT"},data:{status:"EXPIRED"}});
      return NextResponse.json({error:"This quotation has expired. Please contact Spore Cybernetics for an updated quotation."},{status:409});
    }
    if(action==="decline"){
      const changed=await prisma.quotation.updateMany({where:{id,status:"SENT"},data:{status:"DECLINED",userId:user.id}});
      if(!changed.count)return NextResponse.json({error:"This quotation has already been updated."},{status:409});
      return NextResponse.json({declined:true});
    }
    const result=await prisma.$transaction(async tx=>{
      const changed=await tx.quotation.updateMany({where:{id,status:"SENT"},data:{status:"ACCEPTED",userId:user.id}});
      if(!changed.count)throw new Error("This quotation has already been accepted or updated.");
      const order=await tx.order.create({data:{
        reference:"SQO-"+Date.now().toString(36).toUpperCase(),
        userId:user.id,customerName:quote.customerName,email:quote.email,
        currency:quote.currency,total:quote.amount,status:"PENDING",
        quotations:{connect:{id:quote.id}}
      }});
      await tx.quotation.update({where:{id:quote.id},data:{orderId:order.id}});
      return order;
    });
    return NextResponse.json({accepted:true,reference:result.reference,invoiceUrl:"/invoice?ref="+encodeURIComponent(result.reference)+"&email="+encodeURIComponent(result.email),paymentUrl:"/payment?ref="+encodeURIComponent(result.reference)},{status:201});
  }catch(e){
    return NextResponse.json({error:e instanceof Error?e.message:"Unable to process quotation."},{status:409});
  }
}
