
-- Function to get total wallet balances by currency
CREATE OR REPLACE FUNCTION public.get_total_balances_by_currency()
RETURNS TABLE(currency text, total_balance numeric)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    currency,
    SUM(balance) as total_balance
  FROM 
    wallets
  WHERE
    is_active = true
  GROUP BY
    currency
  ORDER BY
    total_balance DESC;
$$;

-- Function to get wallet transaction stats
CREATE OR REPLACE FUNCTION public.get_wallet_transaction_stats(wallet_id_param UUID)
RETURNS TABLE(
  total_transactions bigint,
  total_deposits numeric,
  total_withdrawals numeric,
  total_transfers_in numeric,
  total_transfers_out numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*) as total_transactions,
    COALESCE(SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END), 0) as total_deposits,
    COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawals,
    COALESCE(SUM(CASE WHEN transaction_type = 'transfer_in' THEN amount ELSE 0 END), 0) as total_transfers_in,
    COALESCE(SUM(CASE WHEN transaction_type = 'transfer_out' THEN amount ELSE 0 END), 0) as total_transfers_out
  FROM
    transactions
  WHERE
    wallet_id = wallet_id_param
    AND is_deleted = false;
$$;

-- Function to get transaction volume by day (for charting)
CREATE OR REPLACE FUNCTION public.get_transaction_volume_by_day(days_ago int default 30)
RETURNS TABLE(
  day date,
  total_amount numeric,
  transaction_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH date_series AS (
    SELECT generate_series(
      (CURRENT_DATE - (days_ago || ' days')::interval)::date,
      CURRENT_DATE,
      '1 day'::interval
    )::date as day
  )
  SELECT
    d.day,
    COALESCE(SUM(t.amount), 0) as total_amount,
    COALESCE(COUNT(t.id), 0) as transaction_count
  FROM
    date_series d
    LEFT JOIN transactions t ON DATE(t.created_at) = d.day AND t.is_deleted = false
  GROUP BY
    d.day
  ORDER BY
    d.day;
$$;

-- Function for admin to execute queries safely (only for admin use)
CREATE OR REPLACE FUNCTION public.execute_admin_query(query_text text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- Trigger for soft delete on transactions
CREATE OR REPLACE FUNCTION public.set_soft_delete_transaction()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_deleted = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER soft_delete_transaction
BEFORE DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_soft_delete_transaction();

-- Create Swagger Documentation Table
CREATE TABLE IF NOT EXISTS public.api_documentation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    version TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert Swagger documentation
INSERT INTO public.api_documentation (title, description, version, content)
VALUES (
  'Digital Wallet API',
  'RESTful API for Digital Wallet with Cash Management and Fraud Detection',
  '1.0.0',
  '{
    "openapi": "3.0.0",
    "info": {
      "title": "Digital Wallet API",
      "description": "RESTful API for Digital Wallet with Cash Management and Fraud Detection",
      "version": "1.0.0",
      "contact": {
        "name": "API Support"
      },
      "license": {
        "name": "MIT"
      }
    },
    "servers": [
      {
        "url": "https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1",
        "description": "Production API Server"
      }
    ],
    "components": {
      "securitySchemes": {
        "BearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT"
        }
      }
    },
    "paths": {
      "/auth/register": {
        "post": {
          "summary": "Register a new user",
          "description": "Create a new user account with email and password",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "email": {
                      "type": "string",
                      "format": "email"
                    },
                    "password": {
                      "type": "string",
                      "format": "password"
                    },
                    "username": {
                      "type": "string"
                    },
                    "full_name": {
                      "type": "string"
                    }
                  },
                  "required": ["email", "password"]
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Registration successful"
            },
            "400": {
              "description": "Bad request"
            }
          },
          "tags": ["Authentication"]
        }
      },
      "/auth/login": {
        "post": {
          "summary": "Login user",
          "description": "Authenticate a user with email and password",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "email": {
                      "type": "string",
                      "format": "email"
                    },
                    "password": {
                      "type": "string",
                      "format": "password"
                    }
                  },
                  "required": ["email", "password"]
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Login successful"
            },
            "400": {
              "description": "Bad request"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "tags": ["Authentication"]
        }
      },
      "/wallet/get": {
        "get": {
          "summary": "Get user wallet",
          "description": "Retrieve the authenticated user''s wallet",
          "parameters": [
            {
              "in": "query",
              "name": "currency",
              "schema": {
                "type": "string"
              },
              "description": "Currency code (default: USD)"
            }
          ],
          "responses": {
            "200": {
              "description": "Wallet retrieved successfully"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "tags": ["Wallet Operations"]
        }
      },
      "/wallet/deposit": {
        "post": {
          "summary": "Deposit funds",
          "description": "Add funds to a user''s wallet",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "wallet_id": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "amount": {
                      "type": "number",
                      "minimum": 0.01
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": ["wallet_id", "amount"]
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Deposit successful"
            },
            "400": {
              "description": "Bad request"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "tags": ["Wallet Operations"]
        }
      },
      "/wallet/withdraw": {
        "post": {
          "summary": "Withdraw funds",
          "description": "Withdraw funds from a user''s wallet",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "wallet_id": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "amount": {
                      "type": "number",
                      "minimum": 0.01
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": ["wallet_id", "amount"]
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Withdrawal successful"
            },
            "400": {
              "description": "Bad request"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "tags": ["Wallet Operations"]
        }
      },
      "/wallet/transfer": {
        "post": {
          "summary": "Transfer funds",
          "description": "Transfer funds to another user''s wallet",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "sender_wallet_id": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "recipient_email": {
                      "type": "string",
                      "format": "email"
                    },
                    "amount": {
                      "type": "number",
                      "minimum": 0.01
                    },
                    "description": {
                      "type": "string"
                    }
                  },
                  "required": ["sender_wallet_id", "recipient_email", "amount"]
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Transfer successful"
            },
            "400": {
              "description": "Bad request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "404": {
              "description": "Recipient not found"
            }
          },
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "tags": ["Wallet Operations"]
        }
      },
      "/admin/flagged-transactions": {
        "get": {
          "summary": "Get flagged transactions",
          "description": "Admin endpoint to view transactions flagged for fraud",
          "parameters": [
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 50
              },
              "description": "Maximum number of records to return"
            },
            {
              "in": "query",
              "name": "offset",
              "schema": {
                "type": "integer",
                "default": 0
              },
              "description": "Number of records to skip"
            }
          ],
          "responses": {
            "200": {
              "description": "Flagged transactions retrieved"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden - Admin access required"
            }
          },
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "tags": ["Admin Operations"]
        }
      },
      "/admin/resolve-flag": {
        "post": {
          "summary": "Resolve fraud flag",
          "description": "Admin endpoint to mark a fraud flag as resolved",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "flag_id": {
                      "type": "string",
                      "format": "uuid"
                    },
                    "resolution_note": {
                      "type": "string"
                    }
                  },
                  "required": ["flag_id"]
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Flag resolved"
            },
            "400": {
              "description": "Bad request"
            },
            "401": {
              "description": "Unauthorized"
            },
            "403": {
              "description": "Forbidden - Admin access required"
            }
          },
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "tags": ["Admin Operations"]
        }
      },
      "/scheduled-jobs/daily-fraud-scan": {
        "post": {
          "summary": "Run daily fraud scan",
          "description": "Scheduled job to scan for suspicious transaction patterns",
          "responses": {
            "200": {
              "description": "Scan completed"
            },
            "401": {
              "description": "Unauthorized"
            }
          },
          "security": [
            {
              "BearerAuth": []
            }
          ],
          "tags": ["Scheduled Jobs"]
        }
      }
    }
  }'
) ON CONFLICT DO NOTHING;


-- Create function to get Swagger documentation
CREATE OR REPLACE FUNCTION public.get_api_documentation()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT content FROM api_documentation ORDER BY created_at DESC LIMIT 1;
$$;

-- Create a scheduled job for daily fraud scans (runs at 1:00 AM UTC daily)
-- Note: This requires pg_cron extension to be enabled
-- Please ensure your Supabase project has this extension available
SELECT cron.schedule(
  'daily-fraud-scan',
  '0 1 * * *', -- cron expression for 1:00 AM daily
  $$
  SELECT net.http_post(
    url:='https://wqjwrlkkahsowicaeorr.supabase.co/functions/v1/scheduled-jobs/daily-fraud-scan',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxandybGtrYWhzb3dpY2Flb3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc1ODgxMDUsImV4cCI6MjA2MzE2NDEwNX0.ZvPBa5vIPLDrqcWYJGiC5gtSYFHfMs24KYUWCsPUk9g"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);

-- Create a API documentation edge function
<lov-write file_path="supabase/functions/docs/index.ts">
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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get the API documentation from the database
    const { data, error } = await supabaseClient.rpc("get_api_documentation");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.headers.get("accept") === "application/json") {
      // Return JSON response
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Return HTML Swagger UI
      const swaggerUiHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Digital Wallet API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      background-color: #3b4151;
    }
    .swagger-ui .info .title {
      font-size: 36px;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>

  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        spec: ${JSON.stringify(data)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
      `;

      return new Response(swaggerUiHtml, {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "text/html" },
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
