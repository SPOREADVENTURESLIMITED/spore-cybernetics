import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {hasSafeRequestOrigin} from "@/lib/request-security";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 if(!hasSafeRequestOrigin(req)) return NextResponse.json({error:"Cross-site request rejected."},{status:403});
 if(!await requireAdmin()) return NextResponse.json({error:"Forbidden"},{status:403});
 try{
  const {id}=await params;const v=z.object({reason:z.string().trim().min(5).max(500)}).parse(await req.json());
  const result=await prisma.verifiedDocument.updateMany({where:{id,status:"ACTIVE"},data:{status:"REVOKED",revokedAt:new Date(),revocationReason:v.reason}});
  if(!result.count)return NextResponse.json({error:"Document not found or already revoked."},{status:404});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Unable to revoke document."},{status:400});}
}
