"use client";
import {useState} from "react";
type Provider="FLUTTERWAVE"|"PESAPAL";
export function PaymentInitiator({reference,currency}:{reference:string;currency:string}){
 const[email,setEmail]=useState(""),[phone,setPhone]=useState(""),[provider,setProvider]=useState<Provider>("FLUTTERWAVE"),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function submit(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");try{const r=await fetch("/api/payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference,email,phone,provider})});const d=await r.json();if(!r.ok){setError(d.error||"Could not start checkout.");return}if(!d.checkoutUrl)throw new Error("The payment provider did not return a checkout link.");window.location.assign(d.checkoutUrl)}catch(e){setError(e instanceof Error?e.message:"Network error. Please try again.")}finally{setBusy(false)}}
 return <form className="panel form" onSubmit={submit}>
  <div className="eyebrow">SECURE HOSTED CHECKOUT</div><h2>Choose how to pay</h2>
  <div className="notice"><strong>Order currency: {currency}</strong><p className="small muted">The amount and currency are fixed from your order to prevent checkout tampering.</p></div>
  <label className="field">Payment provider<select value={provider} onChange={e=>setProvider(e.target.value as Provider)}><option value="FLUTTERWAVE">Flutterwave · Cards and supported mobile money</option><option value="PESAPAL">Pesapal · Cards and supported local methods</option></select></label>
  <label className="field">Checkout email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
  <label className="field">Phone number<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+256..." autoComplete="tel"/></label>
  <button className="btn" disabled={busy}>{busy?"Connecting securely…":"Continue to secure payment"}</button>
  {error&&<div className="notice" role="alert">{error}</div>}
  <p className="muted small">You will be redirected to {provider==="FLUTTERWAVE"?"Flutterwave":"Pesapal"} to complete payment. Spore Cybernetics confirms an order only after independently verifying the provider transaction.</p>
 </form>;
}
