import { StdFee } from "@cosmjs/amino";
import { Decimal, Uint53 } from "@cosmjs/math";
import { coins } from "@cosmjs/proto-signing";

/**
 * This is the same as FeeTable from @cosmjs/launchpad but those might diverge in the future.
 */
export type FeeTable = Record<string, StdFee>;

/**
 * A gas price, i.e. the price of a single gas. This is typically a fraction of
 * the smallest fee token unit, such as 0.012utoken.
 *
 * This is the same as GasPrice from @cosmjs/launchpad but those might diverge in the future.
 */
export class GasPrice {
  public readonly amount: Decimal;
  public readonly denom: string;

  public constructor(amount: Decimal, denom: string) {
    this.amount = amount;
    this.denom = denom;
  }

  /**
   * Parses a gas price formatted as `<amount><denom>`, e.g. `GasPrice.fromString("0.012utoken")`.
   */
  public static fromString(gasPrice: string): GasPrice {
    const matchResult = gasPrice.match(/^([0-9.]+?)([a-z]+)$/);
    if (!matchResult) {
      throw new Error("Invalid gas price string");
    }
    const [_, amount, denom] = matchResult;
    if (denom.length < 3 || denom.length > 127) {
      throw new Error("Gas price denomination must be between 3 and 127 characters");
    }
    const fractionalDigits = 18;
    const decimalAmount = Decimal.fromUserInput(amount, fractionalDigits);
    return new GasPrice(decimalAmount, denom);
  }
}

/**
 * This is the same as GasLimits from @cosmjs/launchpad but those might diverge in the future.
 */
export type GasLimits<T extends Record<string, StdFee>> = {
  readonly [key in keyof T]: number;
};

/**
 * This is the same as calculateFee from @cosmjs/launchpad but those might diverge in the future.
 */
function calculateFee(gasLimit: number, { denom, amount: gasPriceAmount }: GasPrice): StdFee {
  const amount = Math.ceil(gasPriceAmount.multiply(new Uint53(gasLimit)).toFloatApproximation());
  return {
    amount: coins(amount, denom),
    gas: gasLimit.toString(),
  };
}

/**
 * This is the same as buildFeeTable from @cosmjs/launchpad but those might diverge in the future.
 */
export function buildFeeTable<T extends Record<string, StdFee>>(
  gasPrice: GasPrice,
  defaultGasLimits: GasLimits<T>,
  gasLimits: Partial<GasLimits<T>>,
): T {
  return Object.entries(defaultGasLimits).reduce(
    (feeTable, [type, defaultGasLimit]) => ({
      ...feeTable,
      [type]: calculateFee(gasLimits[type] || defaultGasLimit, gasPrice),
    }),
    {} as T,
  );
}
