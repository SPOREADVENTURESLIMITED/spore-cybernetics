import "dotenv/config";
import {appendFileSync} from "node:fs";
import {randomBytes,randomUUID} from "node:crypto";
import bcrypt from "bcryptjs";
import {PrismaNeon} from "@prisma/adapter-neon";
import {PrismaClient} from "../generated/node-client/client";

const url=process.env.DATABASE_URL;
if(!url)throw new Error("DATABASE_URL is required for the isolated administrator integration test.");
const prisma=new PrismaClient({adapter:new PrismaNeon({connectionString:url})});
async function main(){
 const mode=process.argv[2];
 if(mode==="provision"){
  const email="spore-admin-e2e-"+randomUUID()+"@example.invalid";
  const password=randomBytes(36).toString("base64url");
  const user=await prisma.user.create({data:{name:"Temporary Automated QA Administrator",email,passwordHash:await bcrypt.hash(password,12),role:"ADMIN"}});
  const envFile=process.env.GITHUB_ENV;
  if(!envFile)throw new Error("GITHUB_ENV is required to pass the temporary login to Playwright.");
  appendFileSync(envFile,"TEST_ADMIN_ID="+user.id+"\nTEST_ADMIN_EMAIL="+email+"\nTEST_ADMIN_PASSWORD="+password+"\n");
  console.log("Temporary administrator provisioned for the authenticated issue/revoke test.");
 }else if(mode==="cleanup"){
  const id=process.env.TEST_ADMIN_ID;const email=process.env.TEST_ADMIN_EMAIL;
  if(!id||!email||!email.startsWith("spore-admin-e2e-")||!email.endsWith("@example.invalid")){console.log("No matching temporary test administrator to clean up.");return;}
  const user=await prisma.user.findUnique({where:{id},select:{id:true,email:true,role:true}});
  if(!user||user.email!==email||user.role!=="ADMIN"){console.log("Temporary test account identity did not match; no cleanup performed.");return;}
  await prisma.verifiedDocument.deleteMany({where:{issuedById:id}});
  await prisma.user.delete({where:{id}});
  console.log("Temporary administrator and its test documents removed.");
 }else throw new Error("Use provision or cleanup.");
}
main().finally(()=>prisma.$disconnect());
