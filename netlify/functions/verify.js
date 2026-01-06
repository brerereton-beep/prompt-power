// netlify/functions/verify.js

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  try {
    const licenseKey =
      event.queryStringParameters?.license_key ||
      event.queryStringParameters?.license ||
      "";

    if (!licenseKey) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, "content-type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Missing license_key" })
      };
    }

    const productId = process.env.GUMROAD_PRODUCT_ID;
    const gumroadToken = process.env.GUMROAD_ACCESS_TOKEN || process.env.GUMROAD_API_KEY;

    if (!productId) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Server not configured (missing product id)." })
      };
    }

    if (!gumroadToken) {
      return {
        statusCode: 500,
        headers: { ...corsHeaders, "content-type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Server not configured (missing Gumroad token)." })
      };
    }

    // Gumroad verify endpoint (commonly used pattern)
    const verifyRes = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        product_id: productId,
        license_key: licenseKey,
        increment_uses_count: "false"
      })
    });

    const data = await verifyRes.json();

    // Gumroad typically returns success boolean
    if (!data || data.success !== true) {
      return {
        statusCode: 401,
        headers: { ...corsHeaders, "content-type": "application/json" },
        body: JSON.stringify({ ok: false, error: "License invalid." })
      };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders, "content-type": "application/json" },
      body: JSON.stringify({ ok: true, gumroad: data })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: "Server error verifying license." })
    };
  }
};
