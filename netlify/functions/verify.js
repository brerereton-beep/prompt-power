const GUMROAD_VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  const license_key = event.queryStringParameters?.license_key;

  if (!license_key) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false, error: "Missing license_key" }),
    };
  }

  const product_permalink = process.env.GUMROAD_PRODUCT_PERMALINK;
  const access_token = process.env.GUMROAD_ACCESS_TOKEN;

  if (!product_permalink || !access_token) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Server not configured (missing env vars)",
      }),
    };
  }

  const params = new URLSearchParams({
    product_permalink,
    license_key,
  });

  try {
    const response = await fetch(
      `${GUMROAD_VERIFY_URL}?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const data = await response.json();

    const valid =
      data?.success === true &&
      !data?.purchase?.refunded &&
      !data?.purchase?.chargebacked &&
      !data?.purchase?.disputed;

    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: valid }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: "Verification failed",
      }),
    };
  }
};
