"use client";

import { useState } from "react";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { Button } from "./ui/button";

interface LoginWithEmailProps {
  onSuccess?: () => void;
  className?: string;
}

export default function LoginWithEmail({
  onSuccess,
  className,
}: LoginWithEmailProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { sendCode, loginWithCode, state } = useLoginWithEmail({
    onComplete: ({
      user,
      isNewUser,
      wasAlreadyAuthenticated,
      loginMethod,
      loginAccount,
    }) => {
      setStep("email");
      setEmail("");
      setCode("");
      setError(null);
      setIsLoading(false);
      onSuccess?.();
    },
    onError: (error) => {
      setIsLoading(false);
      setError(`Error: ${error}`);
    },
  });

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await sendCode({ email: email.trim() });
      setStep("code");
      setIsLoading(false);
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Failed to send code");
    }
  };

  const handleLoginWithCode = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await loginWithCode({ code: code.trim() });
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || "Invalid verification code");
    }
  };

  const resetForm = () => {
    setStep("email");
    setEmail("");
    setCode("");
    setError(null);
    setIsLoading(false);
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {step === "email" ? "Sign In" : "Verify Email"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {step === "email" ? (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendCode()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                disabled={isLoading}
                required
              />
            </div>

            <Button
              onClick={handleSendCode}
              disabled={isLoading || !email.trim()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Sending..." : "Send Verification Code"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Verification Code
              </label>
              <p className="text-sm text-gray-600 mb-2">
                We sent a 6-digit code to <strong>{email}</strong>
              </p>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyPress={(e) => e.key === "Enter" && handleLoginWithCode()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-wider"
                placeholder="000000"
                disabled={isLoading}
                maxLength={6}
                required
              />
            </div>

            <Button
              onClick={handleLoginWithCode}
              disabled={isLoading || code.length !== 6}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Verifying..." : "Verify & Sign In"}
            </Button>

            <div className="flex justify-between text-sm">
              <Button
                onClick={resetForm}
                className="text-blue-500 hover:text-blue-600 underline"
                disabled={isLoading}
              >
                Use different email
              </Button>

              <Button
                onClick={() => {
                  setCode("");
                  setError(null);
                  handleSendCode();
                }}
                className="text-blue-500 hover:text-blue-600 underline"
                disabled={isLoading}
              >
                Resend code
              </Button>
            </div>
          </div>
        )}

        {(state.status === "sending-code" ||
          state.status === "submitting-code") && (
          <div className="mt-4 text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
