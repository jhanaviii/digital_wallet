
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
    // This endpoint should be triggered by a cron job
    // Validate request is from a trusted source (you could add a secret key check)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { path } = getPathAndQuery(req.url);

    switch (path) {
      case "/daily-fraud-scan":
        return await handleDailyFraudScan(supabaseClient, corsHeaders);
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
    path: urlObj.pathname.replace(/^\/scheduled-jobs/, ""),
    query: Object.fromEntries(urlObj.searchParams),
  };
}

async function handleDailyFraudScan(supabaseClient, corsHeaders) {
  console.log("Starting daily fraud scan...");
  
  // Define rules for advanced fraud detection
  const rules = [
    // Rule 1: Detect users with multiple large withdrawals in the past 24 hours
    {
      name: "multiple_large_withdrawals",
      query: `
        SELECT
          t.id AS transaction_id,
          w.user_id,
          COUNT(*) AS withdrawal_count,
          SUM(t.amount) AS total_amount
        FROM
          transactions t
          JOIN wallets w ON t.wallet_id = w.id
        WHERE
          t.transaction_type = 'withdrawal'
          AND t.amount > 200
          AND t.created_at > NOW() - INTERVAL '24 hours'
          AND t.is_flagged = false
        GROUP BY
          t.id, w.user_id
        HAVING
          COUNT(*) >= 3
      `,
      reason: "Multiple large withdrawals in 24 hours",
      severity: "high"
    },
    
    // Rule 2: Detect unusual deposit-withdrawal patterns (deposit followed by quick withdrawal)
    {
      name: "deposit_withdrawal_pattern",
      query: `
        WITH deposits AS (
          SELECT
            wallet_id,
            id,
            amount,
            created_at
          FROM
            transactions
          WHERE
            transaction_type = 'deposit'
            AND created_at > NOW() - INTERVAL '48 hours'
        ),
        withdrawals AS (
          SELECT
            wallet_id,
            id,
            amount,
            created_at
          FROM
            transactions
          WHERE
            transaction_type = 'withdrawal'
            AND created_at > NOW() - INTERVAL '48 hours'
            AND is_flagged = false
        )
        SELECT
          w.id AS transaction_id,
          w.wallet_id,
          d.amount AS deposit_amount,
          w.amount AS withdrawal_amount,
          w.created_at - d.created_at AS time_difference
        FROM
          withdrawals w
          JOIN deposits d ON w.wallet_id = d.wallet_id
        WHERE
          w.created_at > d.created_at
          AND w.created_at - d.created_at < INTERVAL '6 hours'
          AND w.amount > d.amount * 0.7
      `,
      reason: "Suspicious deposit-withdrawal pattern",
      severity: "medium"
    }
  ];
  
  const results = [];
  
  // Execute each rule
  for (const rule of rules) {
    console.log(`Executing rule: ${rule.name}`);
    
    const { data, error } = await supabaseClient.rpc(
      "execute_admin_query",
      { query_text: rule.query }
    );
    
    if (error) {
      console.error(`Error executing rule ${rule.name}:`, error);
      continue;
    }
    
    console.log(`Found ${data?.length || 0} suspicious transactions for rule ${rule.name}`);
    
    // Flag transactions and create fraud flags
    for (const item of (data || [])) {
      // Update transaction to be flagged
      const { error: updateError } = await supabaseClient
        .from("transactions")
        .update({
          is_flagged: true,
          flag_reason: rule.reason
        })
        .eq("id", item.transaction_id);
      
      if (updateError) {
        console.error(`Error flagging transaction ${item.transaction_id}:`, updateError);
        continue;
      }
      
      // Create fraud flag
      const { error: flagError } = await supabaseClient
        .from("fraud_flags")
        .insert({
          transaction_id: item.transaction_id,
          reason: `${rule.reason} - Daily scan`,
          severity: rule.severity
        });
      
      if (flagError) {
        console.error(`Error creating fraud flag for transaction ${item.transaction_id}:`, flagError);
        continue;
      }
      
      results.push({
        transaction_id: item.transaction_id,
        rule: rule.name,
        severity: rule.severity
      });
      
      // Send mock email alert for high severity flags
      if (rule.severity === "high") {
        // In a production system, you would integrate with an email service here
        console.log(`MOCK EMAIL ALERT: High severity fraud flag detected for transaction ${item.transaction_id}`);
      }
    }
  }
  
  console.log(`Daily fraud scan completed. ${results.length} new flags created.`);
  
  // Generate summary report
  const report = {
    scan_time: new Date().toISOString(),
    total_flags: results.length,
    rules_executed: rules.length,
    flags_by_severity: {
      high: results.filter(r => r.severity === "high").length,
      medium: results.filter(r => r.severity === "medium").length,
      low: results.filter(r => r.severity === "low").length,
    },
    flags_by_rule: Object.fromEntries(
      rules.map(rule => [
        rule.name,
        results.filter(r => r.rule === rule.name).length
      ])
    )
  };
  
  return new Response(
    JSON.stringify({
      message: "Daily fraud scan completed successfully",
      report,
      flags: results
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
