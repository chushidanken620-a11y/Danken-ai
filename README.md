# Danken AI — zero-budget Cloudflare Pages build

Danken AI is a mobile-friendly chat website using Cloudflare Pages Functions and the Cloudflare Workers AI binding. No OpenAI/Gemini API key, Node.js install, or paid website builder is required. Cloudflare's free allocation is limited; this is not unlimited AI usage.

## Files

- `public/` — chat website (HTML, CSS, JavaScript)
- `functions/api/chat.js` — secure server-side AI endpoint
- `functions/api/status.js` — connection status endpoint

## Deploy using an Android phone

### 1. Create a GitHub repository

1. Open https://github.com in your phone browser and sign in or create a free account.
2. Create a new public repository named `danken-ai` (public makes Pages setup straightforward; do not put secrets in this repository).
3. Extract this ZIP using your phone's Files app.
4. Upload the project files and folders to the repository. Keep this structure at the repository root:

   - `public/index.html`
   - `public/styles.css`
   - `public/app.js`
   - `functions/api/chat.js`
   - `functions/api/status.js`

   Do not upload `.env` files, API tokens, or passwords. The AI binding is configured in Cloudflare and no secret key is stored in this source.

### 2. Create a Cloudflare Pages project

1. Open https://dash.cloudflare.com and create a free account if needed.
2. Go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Connect GitHub and select the `danken-ai` repository.
4. For the build settings, choose no build command and set the build output directory to `public`. If a root directory field appears, leave it as `/`.
5. Deploy. The static site can appear before AI is connected; that is expected.

### 3. Enable Workers AI binding

1. In Cloudflare, open the new Pages project.
2. Go to **Settings** → **Functions** → **Workers AI bindings** (the exact labels may vary).
3. Add a binding with variable name exactly `AI` and select/save it.
4. Redeploy the latest commit if Cloudflare asks you to.

### 4. Test it

Open the `*.pages.dev` URL shown by Cloudflare. The status in the sidebar should say `Connected · Cloudflare Workers AI`. Send a simple message such as “Explain photosynthesis in simple terms.”

## Free usage and safety

Cloudflare currently documents a free Workers AI allocation of 10,000 Neurons per day, resetting at 00:00 UTC, and a free Workers request limit. If the free AI quota is exhausted, the chat displays a friendly retry-later message. Limits and model availability can change; review https://developers.cloudflare.com/workers-ai/platform/pricing/ before launch. Some models/features may require billing; this project uses `@cf/meta/llama-3.1-8b-instruct-fast`, but the account must have the AI binding available on its Free plan.

Because the site is public, anyone who finds the URL can use the AI quota. Do not advertise it widely until you have checked usage. The current version has basic input validation but does not include accounts, persistent server-side chat history, CAPTCHA, or a robust distributed per-user rate limiter. Do not collect sensitive personal information through the site.

## Official docs

- Workers AI pricing: https://developers.cloudflare.com/workers-ai/platform/pricing/
- Workers AI binding: https://developers.cloudflare.com/workers-ai/configuration/bindings/
- Pages Functions: https://developers.cloudflare.com/pages/functions/
Deployment refresh — October 17, 2026
