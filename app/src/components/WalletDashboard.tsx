"use client";

import { useAuth, useWallet } from "@crossmint/client-sdk-react-ui";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, ExternalLink, Wallet, Coins, ArrowUpRight } from "lucide-react";

export default function WalletDashboard() {
  const { user, status: authStatus } = useAuth();
  const { wallet, status: walletStatus } = useWallet();
  const [balances, setBalances] = useState<any>(null);
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>("");

  // Fetch balances when wallet is available
  useEffect(() => {
    const fetchBalances = async () => {
      if (wallet && walletStatus === "loaded") {
        try {
          const balanceData = await wallet.balances();
          setBalances(balanceData);
        } catch (error) {
          console.error("Error fetching balances:", error);
        }
      }
    };

    fetchBalances();
  }, [wallet, walletStatus]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleTransfer = async () => {
    if (!wallet || !transferAmount || !recipientAddress) return;

    setIsTransferring(true);
    setTransferStatus("Initiating transfer...");

    try {
      const result = await wallet.send(
        recipientAddress,
        "solana:11111111111111111111111111111112", // SOL token locator
        transferAmount
      );

      setTransferStatus(`Transfer successful! Hash: ${result.hash}`);
      setTransferAmount("");
      setRecipientAddress("");

      // Refresh balances
      const updatedBalances = await wallet.balances();
      setBalances(updatedBalances);
    } catch (error) {
      setTransferStatus(
        `Transfer failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsTransferring(false);
    }
  };

  const openInExplorer = (address: string) => {
    const explorerUrl = `https://explorer.solana.com/address/${address}?cluster=devnet`;
    window.open(explorerUrl, "_blank");
  };

  if (authStatus === "logged-out") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <Wallet className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Please log in to access your Solana wallet
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (walletStatus === "in-progress") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <CardTitle>Creating Your Wallet</CardTitle>
            <CardDescription>Setting up your Solana wallet...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-red-500">Wallet Not Available</CardTitle>
            <CardDescription>
              There was an issue creating your wallet. Please try logging out
              and back in.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Wallet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Your Solana Wallet
          </CardTitle>
          <CardDescription>
            Manage your wallet and view balances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Wallet Address</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="address"
                value={wallet.address}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(wallet.address)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openInExplorer(wallet.address)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Balances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balances ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600">SOL Balance</div>
                  <div className="text-2xl font-bold">
                    {balances.nativeToken?.amount || "0"} SOL
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600">USDC Balance</div>
                  <div className="text-2xl font-bold">
                    ${balances.usdc?.amount || "0"}
                  </div>
                </div>
              </div>

              {balances.tokens && balances.tokens.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Other Tokens</h4>
                  <div className="space-y-2">
                    {balances.tokens.map((token: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-2 border rounded"
                      >
                        <span className="font-mono text-sm">
                          {token.symbol || token.address}
                        </span>
                        <span>{token.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p>Loading balances...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Send SOL
          </CardTitle>
          <CardDescription>
            Transfer SOL to another wallet address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="Enter Solana wallet address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="font-mono"
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000000001"
              placeholder="0.0"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
            />
          </div>
          <Button
            onClick={handleTransfer}
            disabled={isTransferring || !transferAmount || !recipientAddress}
            className="w-full"
          >
            {isTransferring ? "Transferring..." : "Send SOL"}
          </Button>
          {transferStatus && (
            <div
              className={`text-sm p-3 rounded ${
                transferStatus.includes("successful")
                  ? "bg-green-100 text-green-800"
                  : transferStatus.includes("failed")
                  ? "bg-red-100 text-red-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {transferStatus}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
