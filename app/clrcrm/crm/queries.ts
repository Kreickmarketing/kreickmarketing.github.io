import { getServerSupabase } from "@/lib/supabase-server";
import { num, type Client, type Product } from "./data";

// Reads go through the logged-in user's Supabase session, so the row rules
// (RLS) decide what comes back.
export async function getClients(): Promise<Client[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("clients").select("*").order("lead_code", { nullsFirst: false });
  return (data ?? []).map((c) => ({ ...c, deal_value: num(c.deal_value), probability: num(c.probability) }));
}

export async function getClient(id: string): Promise<Client | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  return data ? { ...data, deal_value: num(data.deal_value), probability: num(data.probability) } : null;
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await getServerSupabase();
  const { data } = await supabase.from("products").select("*").order("product_code");
  return (data ?? []).map((p) => ({ ...p, price: num(p.price), price_min: num(p.price_min), price_max: num(p.price_max) }));
}
