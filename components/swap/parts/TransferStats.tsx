import Image from "next/image";
import { getSelectedAssetSymbol, useSwapStore } from "../../../store";
import { AssetConfig } from "@axelar-network/axelarjs-sdk";

import { AddressShortener, StatsWrapper } from "../../common";
import { renderGasFee } from "../../../utils/renderGasFee";
import { copyToClipboard } from "../../../utils";
import { SwapStatus } from "../../../utils/enums";
import { AXELARSCAN_URL } from "../../../config/constants";
import { getWagmiChains } from "../../../config/web3";
import { useGetMaxTransferAmount } from "../../../hooks/useGetMaxTransferAmount";

export const TransferStats = () => {
  const {
    txInfo,
    srcChain,
    destChain,
    asset,
    depositAddress,
    destAddress,
    swapStatus,
  } = useSwapStore((state) => state);
  const selectedAssetSymbol = useSwapStore(getSelectedAssetSymbol);
  const max = useGetMaxTransferAmount();

  function renderWaitTime() {
    if (!srcChain) return "";

    if (srcChain.module === "axelarnet") return "~2 minutes";

    if (["ethereum", "polygon"].includes(srcChain?.chainName?.toLowerCase()))
      return "~15 minutes";

    return "~3 minutes";
  }

  function renderMaxTransferAmount() {
    if (max && Number(max) > 0) {
      const tooltipText =
        "Any transfers in excess may result in longer settlement times. Contact us on Discord if you encounter any issues.";
      return (
        <li className="flex justify-between">
          <span
            className="flex flex-row cursor-pointer tooltip tooltip-warning"
            data-tip={tooltipText}
          >
            <span>Maximum Transfer Amount </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="w-5 h-5 pb-1 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>:</span>
          </span>
          <span className="font-semibold">
            {BigInt(max).toLocaleString()} {selectedAssetSymbol}
          </span>
        </li>
      );
    }
    return null;
  }

  function renderDepositAddress() {
    if (swapStatus === SwapStatus.IDLE) return null;
    if (!depositAddress) return null;
    return (
      <li className="flex justify-between">
        <span
          className="font-medium text-green-300 cursor-help tooltip"
          data-tip={`Temporary deposit address generated by Axelar. Transfers of ${selectedAssetSymbol} to this address will be monitored by Axelar and forwarded to ${
            destChain.chainName[0].toUpperCase() +
            destChain.chainName.substring(1)
          }`}
        >
          Axelar Deposit Address
        </span>
        <div className="flex font-bold gap-x-2">
          <AddressShortener value={depositAddress} />
          <div
            className="cursor-pointer"
            onClick={() => copyToClipboard(depositAddress)}
          >
            <Image src={"/assets/ui/copy.svg"} height={16} width={16} />
          </div>
        </div>
      </li>
    );
  }

  function renderDestinationAddress() {
    if (swapStatus === SwapStatus.IDLE) return null;
    return (
      <li className="flex justify-between">
        <span>Destination Address</span>
        <span className="flex font-bold gap-x-2">
          <AddressShortener value={destAddress} />
          <div
            className="cursor-pointer"
            onClick={() => copyToClipboard(destAddress)}
          >
            <Image src={"/assets/ui/copy.svg"} height={16} width={16} />
          </div>
        </span>
      </li>
    );
  }

  function renderDepositConfirmationLink() {
    if (!txInfo.sourceTxHash) return null;
    const evmRpc = getWagmiChains().find(
      (network) =>
        network.networkNameOverride === srcChain.chainName.toLowerCase()
    );
    const rootUrl =
      srcChain.module === "evm"
        ? `${evmRpc?.blockExplorers?.default.url}tx/`
        : `${AXELARSCAN_URL}/transfer/`;
    return (
      <li className="flex justify-between">
        <span>Deposit Confirmation</span>
        <a
          href={`${rootUrl}${txInfo.sourceTxHash}`}
          target="_blank"
          rel="noreferrer"
          className="flex font-normal gap-x-2"
        >
          <span className="text-[#00a6ff]">
            View on{" "}
            {srcChain.module === "evm"
              ? evmRpc?.blockExplorers?.default?.name
              : "Axelarscan"}
          </span>
          <Image
            src={"/assets/ui/link.svg"}
            height={16}
            width={16}
            layout="intrinsic"
          />
        </a>
      </li>
    );
  }

  return (
    <StatsWrapper>
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span>Relayer Gas Fees:</span>
          <span className="font-semibold">
            {renderGasFee(srcChain, destChain, asset as AssetConfig)}{" "}
            {selectedAssetSymbol}
          </span>
        </li>
        <li className="flex justify-between ">
          <span>Estimated wait time:</span>
          <span className="font-semibold">{renderWaitTime()}</span>
        </li>
        {renderMaxTransferAmount()}
        {renderDestinationAddress()}
        {renderDepositAddress()}
        {renderDepositConfirmationLink()}
      </ul>
    </StatsWrapper>
  );
};
