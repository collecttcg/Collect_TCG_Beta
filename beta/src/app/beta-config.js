/** V93 beta only. Use a separate Supabase project for owner/write testing. */
export const betaConfig = Object.freeze({
  version: 'V93 beta',
  mode: 'readonly', // 'readonly' or 'sandbox'
  sandboxUrl: '',
  sandboxPublishableKey: ''
});
