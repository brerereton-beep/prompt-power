// netlify/functions/verify.js

exports.handler = async (event) => {
  try {
    // Accept license key as query param: ?license_key=XXXX
    const licenseKey =
      event.queryStringParameters?.license_key ||
      event.queryStringParameters?.license ||
      "";

    if (!licenseKey) {
      return {
        statusCode: 400,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: false, error: "Missing license_key" }),
      };
    }

    const productId = process.env.GUMROAD_PRODUCT_ID;
    if (!productId) {
      return {
        statusCode: 500,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ok: false,
          error: "Server not configured: missing GUMROAD_PRODUCT_ID",
        }),
      };
    }

    // Call Gumroad license verification endpoint
    const params = new URLSearchParams();
    params.set("product_id", productId);
    params.set("license_key", licenseKey);
    // optional: do not increment uses while testing
    params.set("increment_uses_count", "false");

    const resp = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await resp.json();

    // Gumroad returns { success: true/false, ... }
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ok: Boolean(data.success),
        gumroad: data,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(err) }),
    };
  }
};
