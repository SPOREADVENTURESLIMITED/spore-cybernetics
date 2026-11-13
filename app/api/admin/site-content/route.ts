import {NextResponse} from "next/server";
import {z} from "zod";
import {requireAdmin} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
export const runtime="nodejs";
const schema=z.object({heroTitle:z.string().min(3).max(140),heroSubtitle:z.string().min(10).max(1000),aboutText:z.string().min(10).max(2000),contactEmail:z.string().email(),contactPhone:z.string().min(3).max(40),whatsapp:z.string().max(30),address:z.string().max(200),facebook:z.string().url().or(z.literal("")),instagram:z.string().url().or(z.literal("")),linkedin:z.string().url().or(z.literal("")),xUrl:z.string().url().or(z.literal(""))});
export async function PUT(req:Request){if(!await requireAdmin())return NextResponse.json({error:"Forbidden"},{status:403});try{const data=schema.parse(await req.json());const saved=await prisma.siteContent.upsert({where:{id:"global"},create:{id:"global",...data},update:data});return NextResponse.json({ok:true,updatedAt:saved.updatedAt});}catch{return NextResponse.json({error:"Please check the fields and ensure all links are valid URLs."},{status:400});}}
