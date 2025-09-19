import { autumnHandler } from "autumn-js/next";
import { createClient } from "@/lib/supabase/server";

export const { GET, POST } = autumnHandler({
  identify: async (request) => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return {
      customerId: user?.id,
      customerData: {
        email: user?.email,
      },
    };
  },
});