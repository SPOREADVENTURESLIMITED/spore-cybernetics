// ISO-4217 currency codes offered for catalogue pricing and Pesapal checkout.
// Provider account and country settings still determine which codes can actually
// be charged. Flutterwave's documented card currencies are listed separately.
export const PAYMENT_CURRENCY_CODES = `AED AFN ALL AMD ANG AOA ARS AUD AWG AZN BAM BBD BDT BGN BHD BIF BMD BND BOB BRL BSD BTN BWP BYN BZD CAD CDF CHF CLP CNY COP CRC CUP CVE CZK DJF DKK DOP DZD EGP ERN ETB EUR FJD FKP GBP GEL GHS GIP GMD GNF GTQ GYD HKD HNL HTG HUF IDR ILS INR IQD IRR ISK JMD JOD JPY KES KGS KHR KMF KPW KRW KWD KYD KZT LAK LBP LKR LRD LSL LYD MAD MDL MGA MKD MMK MNT MOP MRU MUR MVR MWK MXN MYR MZN NAD NGN NIO NOK NPR NZD OMR PAB PEN PGK PHP PKR PLN PYG QAR RON RSD RUB RWF SAR SBD SCR SDG SEK SGD SHP SLE SLL SOS SRD SSP STN SVC SYP SZL THB TJS TMT TND TOP TRY TTD TWD TZS UAH UGX USD UYU UZS VES VND VUV WST XAF XCD XOF XPF YER ZAR ZMW ZWL`.split(" ");
export function isPaymentCurrency(value:string):boolean {
 return PAYMENT_CURRENCY_CODES.includes(value.toUpperCase());
}
export const FLUTTERWAVE_CURRENCIES = new Set([
 "GBP","CAD","XAF","COP","EGP","EUR","GHS","KES","INR","NGN","RWF",
 "SLL","ZAR","TZS","UGX","USD","XOF","ZMW"
]);
