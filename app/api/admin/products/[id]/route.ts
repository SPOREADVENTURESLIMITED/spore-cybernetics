import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {requireAdmin} from "@/lib/auth";
import {isPaymentCurrency} from "@/lib/payment-currencies";
const schema=z.object({price:z.number().nonnegative(),currency:z.string().length(3).refine(isPaymentCurrency,"Unsupported currency")});
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){if(!await requireAdmin())return NextResponse.json({error:"Forbidden"},{status:403});try{const {id}=await params;const v=schema.parse(await req.json());const row=await prisma.product.update({where:{id},data:v});return NextResponse.json({id:row.id,price:Number(row.price),currency:row.currency});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:"Unable to update product price."},{status:400});}}
