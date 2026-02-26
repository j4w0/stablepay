INSERT OR IGNORE INTO merchants (
  merchant_id,
  version,
  address,
  supported_network_ids,
  supported_currencies,
  metadata
) VALUES (
  '11111111-1111-4111-8111-111111111111',
  '1.0',
  '0x1111111111111111111111111111111111111111',
  '[11155111]',
  '["USD"]',
  '{"name":"StablePay Demo Merchant","description":"Demo merchant for public testing","websiteUrl":"https://stablepay.demo"}'
);
