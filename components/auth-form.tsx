"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

export function AuthForm({mode,adminOnly=false}:{mode:"login"|"register";adminOnly?:boolean}){
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const router=useRouter();
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setError("");
  const form=e.currentTarget;
  try{
   const data=Object.fromEntries(new FormData(form));
   const r=await fetch(`/api/auth/${mode}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
   const j=await r.json().catch(()=>({}));
   if(!r.ok)throw new Error(j.error||"Unable to continue. Please try again.");
   if(adminOnly&&j.role!=="ADMIN"){
    await fetch("/api/auth/logout",{method:"POST"}).catch(()=>undefined);
    throw new Error("This account does not have administrator access.");
   }
   router.push(j.role==="ADMIN"?"/admin":"/portal");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Connection error. Please try again.");}
  finally{setBusy(false);}
 }
 return <form className="panel form" onSubmit={submit}>
  {mode==="register"&&<label className="field">Full name<input name="name" required minLength={2} maxLength={100}/></label>}
  <label className="field">Email<input name="email" type="email" required maxLength={254}/></label>
  {mode==="register"&&<label className="field">Phone<input name="phone" maxLength={30}/></label>}
  <label className="field">Password<input name="password" type="password" required minLength={mode==="register"?10:1} maxLength={128}/></label>
  <button className="btn" disabled={busy}>{busy?"Please wait...":mode==="login"?"Sign in":"Create account"}</button>
  {error&&<div className="notice" style={{color:"#ffb6a6"}} role="alert">{error}</div>}
 </form>;
}