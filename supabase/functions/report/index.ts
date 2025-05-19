
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

    const { path, query } = getPathAndQuery(req.url);

    switch (path) {
      case "/transaction-history":
        return await handleTransactionHistory(supabaseClient, user.id, query, corsHeaders);
      case "/wallet-summary":
        return await handleWalletSummary(supabaseClient, user.id, corsHeaders);
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
    path: urlObj.pathname.replace(/^\/report/, ""),
    query: Object.fromEntries(urlObj.searchParams),
  };
}

async function handleTransactionHistory(supabaseClient, userId, query, corsHeaders) {
  const limit = parseInt(query.limit || "50");
  const offset = parseInt(query.offset || "0");
  const start_date = query.start_date;
  const end_date = query.end_date;
  const transaction_type = query.transaction_type;
  
  // Get user's wallets
  const { data: wallets, error: walletsError } = await supabaseClient
    .from("wallets")
    .select("id")
    .eq("user_id", userId);
  
  if (walletsError) {
    return new Response(JSON.stringify({ error: walletsError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const walletIds = wallets.map(w => w.id);
  
  // Build transaction query
  let transactionQuery = supabaseClient
    .from("transactions")
    .select(`
      id,
      wallet_id,
      transaction_type,
      amount,
      recipient_wallet_id,
      description,
      created_at,
      is_flagged,
      flag_reason,
      wallet:wallet_id(currency)
    `)
    .in("wallet_id", walletIds)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });
  
  // Apply filters
  if (start_date) {
    transactionQuery = transactionQuery.gte("created_at", start_date);
  }
  
  if (end_date) {
    transactionQuery = transactionQuery.lte("created_at", end_date);
  }
  
  if (transaction_type) {
    transactionQuery = transactionQuery.eq("transaction_type", transaction_type);
  }
  
  // Apply pagination
  transactionQuery = transactionQuery.range(offset, offset + limit - 1);
  
  const { data: transactions, error: transactionsError } = await transactionQuery;
  
  if (transactionsError) {
    return new Response(JSON.stringify({ error: transactionsError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  // Get transaction count for pagination
  let countQuery = supabaseClient
    .from("transactions")
    .select("id", { count: "exact" })
    .in("wallet_id", walletIds)
    .eq("is_deleted", false);
  
  // Apply the same filters to the count query
  if (start_date) {
    countQuery = countQuery.gte("created_at", start_date);
  }
  
  if (end_date) {
    countQuery = countQuery.lte("created_at", end_date);
  }
  
  if (transaction_type) {
    countQuery = countQuery.eq("transaction_type", transaction_type);
  }
  
  const { count, error: countError } = await countQuery;
  
  if (countError) {
    return new Response(JSON.stringify({ error: countError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  // Calculate transaction stats
  const stats = {
    total_transactions: count,
    deposits: 0,
    withdrawals: 0,
    transfers_out: 0,
    transfers_in: 0
  };
  
  if (transactions.length > 0) {
    // Group by transaction type
    for (const tx of transactions) {
      switch (tx.transaction_type) {
        case 'deposit':
          stats.deposits++;
          break;
        case 'withdrawal':
          stats.withdrawals++;
          break;
        case 'transfer_out':
          stats.transfers_out++;
          break;
        case 'transfer_in':
          stats.transfers_in++;
          break;
      }
    }
  }
  
  return new Response(
    JSON.stringify({
      transactions,
      pagination: {
        total: count,
        page_size: limit,
        offset,
        has_more: offset + transactions.length < count
      },
      stats
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function handleWalletSummary(supabaseClient, userId, corsHeaders) {
  // Get user's wallets
  const { data: wallets, error: walletsError } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);
  
  if (walletsError) {
    return new Response(JSON.stringify({ error: walletsError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  // Get transaction summaries for each wallet
  const walletSummaries = [];
  let totalBalance = 0;
  
  for (const wallet of wallets) {
    // Get transaction stats for this wallet
    const { data: stats, error: statsError } = await supabaseClient.rpc(
      "get_wallet_transaction_stats",
      { wallet_id_param: wallet.id }
    );
    
    if (statsError) {
      console.error(`Error fetching stats for wallet ${wallet.id}:`, statsError);
      continue;
    }
    
    walletSummaries.push({
      wallet,
      stats: stats[0] || {
        total_transactions: 0,
        total_deposits: 0,
        total_withdrawals: 0,
        total_transfers_in: 0,
        total_transfers_out: 0
      }
    });
    
    // Convert to number and add to total
    totalBalance += parseFloat(wallet.balance);
  }
  
  // Get user profile
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("username, email, full_name, created_at")
    .eq("id", userId)
    .single();
  
  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  // Get recent transactions
  const { data: recentTransactions, error: txError } = await supabaseClient
    .from("transactions")
    .select(`
      id,
      wallet_id,
      transaction_type,
      amount,
      description,
      created_at,
      is_flagged,
      wallet:wallet_id(currency)
    `)
    .in(
      "wallet_id",
      wallets.map(w => w.id)
    )
    .order("created_at", { ascending: false })
    .limit(5);
  
  if (txError) {
    return new Response(JSON.stringify({ error: txError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  return new Response(
    JSON.stringify({
      profile,
      wallets: walletSummaries,
      total_balance: totalBalance,
      recent_transactions: recentTransactions,
      summary: {
        wallet_count: wallets.length,
        account_age_days: Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
      }
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
