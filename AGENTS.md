# Shopify app development

This app is scaffolded from a Shopify app template. See the README for framework-specific details.

Use the [Shopify AI Toolkit](https://shopify.dev/docs/apps/build/ai-toolkit) for all Shopify API and platform work. If missing, install it in the agent host per that page (or `npx skills add Shopify/shopify-ai-toolkit --list` for skill-compatible hosts) — do not add tooling to this repo.

## Khakan Connect project rules

Khakan Connect connects Shopify seller stores to a fulfillment Shopify store. Seller stores receive customer orders and Khakan Connect selectively routes mapped line items to the fulfillment store.

### Git safety

- Use `dev` as the development base branch.
- Never commit directly to `main` or `dev`.
- Agent changes must occur on an `agent/*` branch.
- Never force push.
- Do not commit, push, create pull requests, or merge unless explicitly instructed.
- Keep changes scoped to the requested task.

### Shopify safety

- Do not create real Shopify orders unless explicitly requested.
- Do not fulfill, cancel, refund, modify, or otherwise alter real customer orders.
- Do not deploy the Shopify app automatically.
- Do not run `shopify app deploy`.
- Do not change Shopify API scopes, app configuration, or store configuration without explicit approval.
- Do not expose Shopify access tokens, API keys, secrets, session data, or environment variables.
- Do not modify `.env` files.

### Fulfillment behavior

- Preserve the Seller Store -> Khakan Connect -> Fulfillment Store architecture.
- Only mapped seller products/line items should be routed to fulfillment.
- Preserve SKU/product mapping behavior unless the task specifically changes it.
- Preserve duplicate-order protection.
- Do not remove safeguards that prevent duplicate fulfillment orders.
- Do not change fulfillment or tracking synchronization behavior unless requested.

### Database / Prisma safety

- Do not run Prisma migrations automatically.
- Do not run `prisma migrate deploy`, `prisma migrate dev`, database reset, seed, or destructive database commands without explicit approval.
- Do not modify `prisma/schema.prisma` unless the task specifically requires a database schema change.
- Database/schema changes require human review before execution.

### Dependencies

- Do not install, remove, or upgrade dependencies unless required by the task.
- Do not modify package-lock.json unless dependency changes are explicitly required.

### Verification

For normal code changes run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `git diff --check`

Do not use `npm run setup` as an automatic verification command because it executes Prisma migration deployment.

### Final report

After completing a task, report:

- what changed
- files changed
- verification commands run
- verification failures or warnings
- active branch
- anything requiring human review

Do not commit or push changes automatically.
