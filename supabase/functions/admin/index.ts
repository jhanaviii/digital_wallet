
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the user is an admin
    const { data: profileData, error: profileError } = await supabaseClient
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (profileError || profileData.username !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin access required" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { path, query } = getPathAndQuery(req.url);
    const body = await req.json().catch(() => ({}));

    switch (path) {
      case "/flagged-transactions":
        return await handleFlaggedTransactions(supabaseClient, query, corsHeaders);
      case "/resolve-flag":
        return await handleResolveFlag(supabaseClient, body, user.id, corsHeaders);
      case "/total-balances":
        return await handleTotalBalances(supabaseClient, corsHeaders);
      case "/top-users":
        return await handleTopUsers(supabaseClient, query, corsHeaders);
      case "/transaction-volume":
        return await handleTransactionVolume(supabaseClient, query, corsHeaders);
      default:
        return new Response(JSON.stringify({ error: "Invalid endpoint" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getPathAndQuery(url: string) {
  const urlObj = new URL(url);
  return {
    path: urlObj.pathname.replace(/^\/admin/, ""),
    query: Object.fromEntries(urlObj.searchParams),
  };
}

async function handleFlaggedTransactions(supabaseClient, query, corsHeaders) {
  const limit = parseInt(query.limit || "50");
  const offset = parseInt(query.offset || "0");
  
  // Get all flagged transactions with their fraud flags
  const { data, error } = await supabaseClient
    .from("admin_transaction_report")
    .select("*")
    .eq("is_flagged", true)
    .order("transaction_date", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ flagged_transactions: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleResolveFlag(supabaseClient, body, adminId, corsHeaders) {
  const { flag_id, resolution_note } = body;

  if (!flag_id) {
    return new Response(
      JSON.stringify({
        error: "Flag ID is required",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Update the fraud flag to resolved
  const { data, error } = await supabaseClient
    .from("fraud_flags")
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: adminId,
      resolution_note: resolution_note || "Resolved by admin",
    })
    .eq("id", flag_id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      message: "Flag resolved successfully",
      flag: data,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function handleTotalBalances(supabaseClient, corsHeaders) {
  // Get sum of all wallet balances by currency
  const { data, error } = await supabaseClient
    .rpc("get_total_balances_by_currency");

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ balances: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleTopUsers(supabaseClient, query, corsHeaders) {
  const limit = parseInt(query.limit || "10");
  const by = query.by || "balance"; // "balance" or "transactions"
  
  let data: any;
  let error: any;
  
  if (by === "balance") {
    // Get top users by wallet balance
    const result = await supabaseClient
      .from("wallets")
      .select(`
        balance,
        currency,
        user:user_id(
          id,
          username,
          email
        )
      `)
      .order("balance", { ascending: false })
      .limit(limit);
    
    data = result.data;
    error = result.error;
  } else {
    // Get top users by transaction count
    const result = await supabaseClient
      .from("profiles")
      .select(`
        id,
        username,
        email,
        transaction_count:wallets(
          id,
          transactions:transactions(count)
        )
      `)
      .order("transaction_count", { ascending: false })
      .limit(limit);
    
    data = result.data;
    error = result.error;
  }

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ top_users: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleTransactionVolume(supabaseClient, query, corsHeaders) {
  const days = parseInt(query.days || "30");
  
  // Get transaction volume over time
  const { data, error } = await supabaseClient
    .rpc("get_transaction_volume_by_day", { days_ago: days });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ transaction_volume: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
