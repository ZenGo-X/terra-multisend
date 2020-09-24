const rp = require('request-promise');
const Chains = {
  columbus_3: 'https://fcd.terra.dev/v1',
  soju: 'https://soju-fcd.terra.dev/v1',
};

export type ChainName = 'columbus_3' | 'soju';

export async function get(chainName: ChainName, route: string): Promise<any> {
  console.log(`${Chains[chainName]}${route}`);
  return rp({
    method: 'GET',
    uri: `${Chains[chainName]}${route}`,
    json: true,
  });
}

export async function post(
  chainName: ChainName,
  route: string,
  body: any,
): Promise<any> {
  // console.log(`${Chains[chainName]}${route}`);
  // console.log(JSON.stringify(body));
  return rp({
    method: 'POST',
    uri: `${Chains[chainName]}${route}`,
    body,
    json: true,
  });
}
