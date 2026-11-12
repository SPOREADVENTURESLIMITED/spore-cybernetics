import {PrismaClient} from "@prisma/client";import bcrypt from "bcryptjs";import {serviceSeed} from "../lib/catalog";
const prisma=new PrismaClient();
async function main(){for(let i=0;i<serviceSeed.length;i++){const [name,category,summary,description,icon,featured]=serviceSeed[i];const slug=String(name).toLowerCase().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"");await prisma.service.upsert({where:{slug},update:{},create:{name,category,summary,description,icon,featured,sortOrder:i,slug}})}
const email=(process.env.ADMIN_EMAIL||"admin@yourdomain.com").toLowerCase();const password=process.env.ADMIN_PASSWORD||"ChangeThisImmediately!";await prisma.user.upsert({where:{email},update:{role:"ADMIN"},create:{name:"Spore Administrator",email,passwordHash:await bcrypt.hash(password,12),role:"ADMIN"}})}
main().then(()=>console.log("Seed completed")).catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
