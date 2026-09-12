import { createClient } from "@/lib/supabase/client";

export async function fetchTradingPartners(): Promise<
  Array<{ id: string; name: string; email: string; industry: string; type: string }>
> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from("companies")
      .select("company_id, name, industry, company_type, contact_details")
      .order("name");

    if (error || !data || data.length === 0) return [];

    return data.map((c) => {
      let email = "";
      if (c.contact_details && typeof c.contact_details === "object" && "email" in c.contact_details) {
        email = String(c.contact_details.email);
      }
      return {
        id: c.company_id,
        name: c.name,
        email,
        industry: c.industry || "Industrial",
        type: c.company_type,
      };
    });
  } catch {
    return [];
  }
}
