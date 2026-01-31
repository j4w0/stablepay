export interface SwapProvider {
  id: SwapProviderId;
}

enum SwapProviderId {
  UNISWAP_V4 = 'uniswap_v4',
  MOCK = 'mock',
}
