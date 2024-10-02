import { assertExists } from "@std/assert";
import { EverhourApiClient, getCurrentUser } from "./main.ts";

Deno.test(async function getCurrentUserTest() {
  const apiKey = Deno.env.get("EVERHOUR_API_KEY");
  assertExists(apiKey);
  const client = new EverhourApiClient(apiKey);
  const user = await getCurrentUser(client);
  assertExists(user?.id);
});
