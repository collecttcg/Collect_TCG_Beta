# Separate database for full beta testing

The default `readonly` mode can test browsing, filters, galleries, favorites, related cards, navigation and local downloads. It cannot test successful owner writes or public review submission.

For those flows:

1. Create a separate Supabase project owned by you. Do not use the production project `cbzytysxtdcqxuckspye`.
2. Reproduce the production schema, SQL functions, RLS policies, storage buckets and required Edge Functions using your own reviewed schema export/migrations. An anonymized or disposable subset of records is sufficient.
3. Copy test images into the test project's buckets and rewrite the test records' image URLs. Avoid retaining production image links if zero production traffic is required.
4. Create a **test owner user** and configure the test project's owner authorization predicate. Production credentials are neither copied nor requested by this package.
5. In `beta/src/app/beta-config.js`, change `mode` to `sandbox` and set `sandboxUrl` and `sandboxPublishableKey` to the new project. Only `sb_publishable_...` keys are accepted. Never put an `sb_secret_...` or service-role key in these frontend files.
6. Configure the test project's allowed site/redirect URLs for the beta address as needed.
7. Upload the updated beta folder to the **beta repository** and verify the badge says `TEST DATABASE` before testing changes.

The beta rejects the known production project in sandbox mode. It also blocks production API access in that mode, so an accidentally retained production database/image URL will fail instead of modifying production.

The repository contained no database schema, RLS migrations, bucket policies or Edge Function source. Consequently this package does not invent a replacement schema or claim to include a provisioned sandbox backend. Owner authorization and every write flow must be tested against your real cloned test schema before release. Authentication, storage, certificate privacy, owner-only data and SQL/Edge Function behavior cannot be proven by frontend-only tests.

Analytics submission, production exclusion-cookie writes, cross-tab session handoffs and service-worker operations remain disabled in beta, including sandbox mode. This is intentional isolation, not an implementation of analytics end-to-end testing.
