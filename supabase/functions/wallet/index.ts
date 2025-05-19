
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
    const body = await req.json().catch(() => ({}));

    switch (path) {
      case "/get":
        return await handleGetWallet(supabaseClient, user.id, query, corsHeaders);
      case "/deposit":
        return await handleDeposit(supabaseClient, user.id, body, corsHeaders);
      case "/withdraw":
        return await handleWithdraw(supabaseClient, user.id, body, corsHeaders);
      case "/transfer":
        return await handleTransfer(supabaseClient, user.id, body, corsHeaders);
      case "/transactions":
        return await handleGetTransactions(supabaseClient, user.id, query, corsHeaders);
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
    path: urlObj.pathname.replace(/^\/wallet/, ""),
    query: Object.fromEntries(urlObj.searchParams),
  };
}

async function handleGetWallet(supabaseClient, userId, query, corsHeaders) {
  const currency = query.currency || "USD";

  const { data, error } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("user_id", userId)
    .eq("currency", currency)
    .eq("is_active", true)
    .single();

  if (error) {
    // If wallet doesn't exist, create one
    if (error.code === 'PGRST116') {
      const { data: newWallet, error: createError } = await supabaseClient
        .from("wallets")
        .insert([
          { user_id: userId, currency: currency }
        ])
        .select('*')
        .single();
        
      if (createError) {
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ wallet: newWallet }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ wallet: data }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleDeposit(supabaseClient, userId, body, corsHeaders) {
  const { wallet_id, amount, description } = body;

  if (!wallet_id || !amount || amount <= 0) {
    return new Response(
      JSON.stringify({
        error: "Valid wallet ID and positive amount are required",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Verify wallet belongs to user
  const { data: walletData, error: walletError } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("id", wallet_id)
    .eq("user_id", userId)
    .single();

  if (walletError || !walletData) {
    return new Response(JSON.stringify({ error: "Wallet not found or access denied" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Call the deposit_funds function
  const { data, error } = await supabaseClient.rpc("deposit_funds", {
    wallet_id,
    deposit_amount: amount,
    description: description || "Deposit",
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get updated wallet
  const { data: updatedWallet } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("id", wallet_id)
    .single();

  return new Response(
    JSON.stringify({
      message: "Deposit successful",
      transaction_id: data,
      wallet: updatedWallet,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function handleWithdraw(supabaseClient, userId, body, corsHeaders) {
  const { wallet_id, amount, description } = body;

  if (!wallet_id || !amount || amount <= 0) {
    return new Response(
      JSON.stringify({
        error: "Valid wallet ID and positive amount are required",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Verify wallet belongs to user
  const { data: walletData, error: walletError } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("id", wallet_id)
    .eq("user_id", userId)
    .single();

  if (walletError || !walletData) {
    return new Response(JSON.stringify({ error: "Wallet not found or access denied" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Call the withdraw_funds function
  const { data, error } = await supabaseClient.rpc("withdraw_funds", {
    wallet_id,
    withdrawal_amount: amount,
    description: description || "Withdrawal",
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get updated wallet
  const { data: updatedWallet } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("id", wallet_id)
    .single();

  return new Response(
    JSON.stringify({
      message: "Withdrawal successful",
      transaction_id: data,
      wallet: updatedWallet,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function handleTransfer(supabaseClient, userId, body, corsHeaders) {
  const { sender_wallet_id, recipient_username, amount, description } = body;

  if (!sender_wallet_id || !recipient_username || !amount || amount <= 0) {
    return new Response(
      JSON.stringify({
        error: "Valid wallet ID, recipient username, and positive amount are required",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Verify sender wallet belongs to user
  const { data: senderWallet, error: senderWalletError } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("id", sender_wallet_id)
    .eq("user_id", userId)
    .single();

  if (senderWalletError || !senderWallet) {
    return new Response(JSON.stringify({ error: "Wallet not found or access denied" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Find recipient user by username
  const { data: recipientProfile, error: recipientError } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("username", recipient_username)
    .single();

  if (recipientError || !recipientProfile) {
    return new Response(JSON.stringify({ error: "Recipient not found. Please check the username and try again." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Find recipient's wallet matching the sender's currency
  const { data: recipientWallet, error: recipientWalletError } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("user_id", recipientProfile.id)
    .eq("currency", senderWallet.currency)
    .eq("is_active", true)
    .single();

  // If recipient doesn't have a wallet in this currency, create one
  let targetRecipientWallet = recipientWallet;
  
  if (recipientWalletError || !recipientWallet) {
    const { data: newWallet, error: createError } = await supabaseClient
      .from("wallets")
      .insert([
        { 
          user_id: recipientProfile.id, 
          currency: senderWallet.currency,
          balance: 0,
          is_active: true
        }
      ])
      .select('*')
      .single();
      
    if (createError) {
      return new Response(JSON.stringify({ error: "Failed to create wallet for recipient. Please try again." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    targetRecipientWallet = newWallet;
  }

  // Call the transfer_funds function
  const { data, error } = await supabaseClient.rpc("transfer_funds", {
    sender_wallet_id,
    recipient_wallet_id: targetRecipientWallet.id,
    transfer_amount: amount,
    description: description || `Transfer to ${recipient_username}`,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get updated wallet
  const { data: updatedWallet } = await supabaseClient
    .from("wallets")
    .select("*")
    .eq("id", sender_wallet_id)
    .single();

  return new Response(
    JSON.stringify({
      message: "Transfer successful",
      transaction_id: data,
      wallet: updatedWallet,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

async function handleGetTransactions(supabaseClient, userId, query, corsHeaders) {
  const limit = parseInt(query.limit || "10");
  const offset = parseInt(query.offset || "0");
  const wallet_id = query.wallet_id;

  // Ensure user can only view their own transactions
  let walletQuery = supabaseClient
    .from("wallets")
    .select("id")
    .eq("user_id", userId);

  if (wallet_id) {
    walletQuery = walletQuery.eq("id", wallet_id);
  }

  const { data: wallets, error: walletsError } = await walletQuery;

  if (walletsError) {
    return new Response(JSON.stringify({ error: walletsError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const walletIds = wallets.map((w) => w.id);

  if (walletIds.length === 0) {
    return new Response(JSON.stringify({ transactions: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get transactions for these wallets
  const { data: transactions, error: transactionsError } = await supabaseClient
    .from("transactions")
    .select(`
      *,
      wallet:wallet_id(currency),
      recipient_wallet:recipient_wallet_id(
        wallet_id,
        user:user_id(email, username)
      )
    `)
    .in("wallet_id", walletIds)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (transactionsError) {
    return new Response(JSON.stringify({ error: transactionsError.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      transactions,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
