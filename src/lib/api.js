const JSON_HEADERS = {
  Accept: "application/json"
};

export async function apiRequest(path, { body, method = "GET", token } = {}) {
  const headers = new Headers(JSON_HEADERS);
  const options = { headers, method };

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(
      typeof data === "object" && data?.message ? data.message : "Не удалось выполнить запрос."
    );
    error.status = response.status;
    throw error;
  }

  return data;
}
