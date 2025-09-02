"use client";

import { useState } from "react";
import {
  CrossmintEmbeddedCheckout,
  CrossmintCheckoutProvider,
} from "@crossmint/client-sdk-react-ui";
import { useAuth } from "@crossmint/client-sdk-react-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DAOParticipation() {
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string>("");

  // Example DAO participation options
  const daoActions = [
    {
      id: "membership",
      title: "DAO Membership NFT",
      description: "Get voting rights in the DAO",
      price: "0.1",
      collectionId: "your-membership-nft-collection-id",
    },
    {
      id: "funding",
      title: "Fund Regenerative Project",
      description: "Support approved community projects",
      price: "0.05",
      collectionId: "your-funding-nft-collection-id",
    },
    {
      id: "governance",
      title: "Governance Token",
      description: "Increase your voting power",
      price: "0.02",
      collectionId: "your-governance-token-collection-id",
    },
  ];

  const handleSelectAction = (action: any) => {
    setSelectedAction(action.id);
    setShowCheckout(true);
  };

  const selectedActionData = daoActions.find(
    (action) => action.id === selectedAction
  );

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Join the DAO</CardTitle>
            <CardDescription>
              Please log in to participate in DAO governance and funding
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Participate in Anectos DAO</h1>
        <p className="text-gray-600">
          Support regenerative businesses and help shape the future of
          sustainable funding
        </p>
      </div>

      {!showCheckout ? (
        <div className="grid md:grid-cols-3 gap-6">
          {daoActions.map((action) => (
            <Card key={action.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-xl">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {action.price} SOL
                  </span>
                </div>
                <Button
                  onClick={() => handleSelectAction(action)}
                  className="w-full"
                >
                  Purchase
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(false)}
              className="mb-4"
            >
              ← Back to Options
            </Button>
            <h2 className="text-2xl font-bold mb-2">
              Complete Your Purchase: {selectedActionData?.title}
            </h2>
            <p className="text-gray-600 mb-6">
              {selectedActionData?.description}
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <CrossmintCheckoutProvider>
              <CrossmintEmbeddedCheckout
                lineItems={{
                  collectionLocator: `crossmint:${selectedActionData?.collectionId}`,
                  callData: {
                    totalPrice: selectedActionData?.price,
                    quantity: 1,
                  },
                }}
                payment={{
                  crypto: {
                    enabled: true,
                    defaultChain: "solana",
                    defaultCurrency: "sol",
                  },
                  fiat: {
                    enabled: true,
                    defaultCurrency: "usd",
                  },
                }}
                recipient={{
                  email: user.email || "",
                }}
                locale="en-US"
              />
            </CrossmintCheckoutProvider>
          </div>
        </div>
      )}
    </div>
  );
}
