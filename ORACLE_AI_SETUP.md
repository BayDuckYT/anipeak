# Oracle AI configuration

Oracle calls the AI provider from a Cloudflare Pages Function. The provider key stays on the server and is never included in the browser bundle.

In Cloudflare Pages, open **Settings → Variables and Secrets** and add these values for both Production and Preview as needed:

| Variable | Value |
| --- | --- |
| `ORACLE_AI_API_KEY` | A newly issued provider API key, stored as a secret |
| `SUPABASE_URL` | The MahoraPeak Supabase project URL |
| `SUPABASE_ANON_KEY` | The Supabase publishable/anon key, used only to validate the signed-in user's session |
| `SUPABASE_SERVICE_KEY` | A newly rotated Supabase service-role key, stored as a secret for existing admin functions |

Do not use `VITE_` prefixes for provider or service-role secrets. Variables with that prefix can be exposed in frontend builds.

Google AI Studio uses Gemini through Google's OpenAI-compatible chat completions endpoint. Oracle defaults to `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions` and the stable `gemini-3.8-flash` model. The optional `ORACLE_AI_CHAT_COMPLETIONS_URL` and `ORACLE_AI_MODEL` variables can override those defaults.

The model must return `choices[0].message.content` containing JSON with a `recommendations` array. Each item must include a candidate `id` and a short Turkish `reason`.

The API key pasted in chat should be revoked and replaced before it is configured here. A Supabase service-role key was also present in project source, so rotate that key too, then save the replacement only as the Cloudflare `SUPABASE_SERVICE_KEY` secret.
