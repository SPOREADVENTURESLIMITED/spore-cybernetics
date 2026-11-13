import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdmin} from "@/lib/auth";
import {isPaymentCurrency} from "@/lib/payment-currencies";
const schema=z.object({price:z.number().nonnegative().nullable(),currency:z.string().length(3).refine(isPaymentCurrency,"Unsupported currency")});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){if(!await requireAdmin())return NextResponse.json({error:"Forbidden"},{status:403});try{const {id}=await params;const v=schema.parse(await req.json());const row=await prisma.service.update({where:{id},data:{price:v.price,currency:v.currency}});return NextResponse.json({id:row.id,price:row.price?Number(row.price):null,currency:row.currency});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to update service price."},{status:400});}}
