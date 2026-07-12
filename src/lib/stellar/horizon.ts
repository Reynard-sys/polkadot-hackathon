import { Horizon } from "@stellar/stellar-sdk";
import { getHorizonUrl } from "@/lib/server-env";

export function createHorizonServer() {
  return new Horizon.Server(getHorizonUrl());
}
