// Payment currencies supported by the hosted gateway integrations.
// This is deliberately an explicit allow-list: providers can reject currencies
// that are not enabled on the merchant account, even when they are ISO-4217 codes.
export const PAYMENT_CURRENCIES = [
  {code:"UGX",name:"Ugandan Shilling"},
  {code:"KES",name:"Kenyan Shilling"},
  {code:"TZS",name:"Tanzanian Shilling"},
  {code:"RWF",name:"Rwandan Franc"},
  {code:"NGN",name:"Nigerian Naira"},
  {code:"GHS",name:"Ghanaian Cedi"},
  {code:"ZAR",name:"South African Rand"},
  {code:"ZMW",name:"Zambian Kwacha"},
  {code:"MWK",name:"Malawian Kwacha"},
  {code:"XAF",name:"Central African CFA Franc"},
  {code:"XOF",name:"West African CFA Franc"},
  {code:"USD",name:"US Dollar"},
  {code:"EUR",name:"Euro"},
  {code:"GBP",name:"Pound Sterling"},
  {code:"CAD",name:"Canadian Dollar"},
  {code:"INR",name:"Indian Rupee"},
  {code:"SLL",name:"Sierra Leonean Leone"},
  {code:"COP",name:"Colombian Peso"},
  {code:"EGP",name:"Egyptian Pound"},
] as const;

export type PaymentCurrency = typeof PAYMENT_CURRENCIES[number]["code"];
export const PAYMENT_CURRENCY_CODES = PAYMENT_CURRENCIES.map(c => c.code);
export function isPaymentCurrency(value: string): value is PaymentCurrency {
  return PAYMENT_CURRENCY_CODES.includes(value as PaymentCurrency);
}

// The documented Flutterwave card-currency list. Local mobile-money methods
// remain country/currency-specific and are displayed by Flutterwave checkout.
export const FLUTTERWAVE_CURRENCIES = new Set<PaymentCurrency>([
  "GBP","CAD","XAF","COP","EGP","EUR","GHS","KES","INR","NGN","RWF",
  "SLL","ZAR","TZS","UGX","USD","XOF","ZMW"
]);
