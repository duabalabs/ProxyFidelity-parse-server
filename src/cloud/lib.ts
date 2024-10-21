import Parse from "parse/node";

const enforceClientAPIKey = (request) => {
  const clientAPIKey = request.headers["x-client-api-key"]; // Pass an API key with the request headers

  if (clientAPIKey !== process.env.CLIENT_API_KEY) {
    throw new Parse.Error(
      Parse.Error.OPERATION_FORBIDDEN,
      "Unauthorized access."
    );
  }
};
export const secureCloudFunction = (fn) => {
  return async (request) => {
    enforceClientAPIKey(request);
    return await fn(request);
  };
};
