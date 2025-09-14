"use client";

import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const { authenticated, user, login } = usePrivy();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    user_role: 0 as 0 | 1,
    company: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email?.address) {
      setFormData((prev) => ({ ...prev, email: user.email!.address }));
    }
  }, [user]);

  useEffect(() => {
    const checkExistingUser = async () => {
      if (!authenticated || !user) {
        setChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("privy_user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Supabase check error:", error);
        }

        if (data) {
          router.replace("/profile");
          return;
        }
      } catch (e) {
        console.error("Error checking existing user:", e);
      } finally {
        setChecking(false);
      }
    };

    checkExistingUser();
  }, [authenticated, user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value) as 0 | 1;
    setFormData((prev) => ({
      ...prev,
      user_role: value,
      // Clear company when switching back to user
      company: value === 1 ? prev.company : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const payload = {
        privy_user_id: user?.id,
        name: formData.name,
        email: user?.email?.address || formData.email,
        wallet_address: user?.wallet?.address ?? null,
        user_role: formData.user_role,
        company: formData.user_role === 1 ? formData.company : null,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "privy_user_id" });

      if (error) throw error;

      router.push("/profile");
    } catch (error) {
      console.error("Error saving user:", error);
      setErrorMsg("We couldn't save your profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!authenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-200 px-4">
        <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 shadow-xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2">
            Authentication required
          </h2>
          <p className="text-blue-700/80 mb-6">
            Connect your wallet or sign in with email to continue to signup.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => login()}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Connect wallet
            </Button>
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full hover:bg-blue-300"
            >
              Go to Home
            </Button>
          </div>
          <p className="mt-4 text-xs text-blue-700/70">Powered by Privy</p>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing signup…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Complete Your Profile
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome! Please provide your name to complete registration.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {errorMsg}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a
              </label>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-gray-700">
                  <input
                    type="radio"
                    name="user_role"
                    value={0}
                    checked={formData.user_role === 0}
                    onChange={handleRoleChange}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>User</span>
                </label>
                <label className="inline-flex items-center gap-2 text-gray-700">
                  <input
                    type="radio"
                    name="user_role"
                    value={1}
                    checked={formData.user_role === 1}
                    onChange={handleRoleChange}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Business owner</span>
                </label>
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={user?.email?.address || formData.email}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            {formData.user_role === 1 && (
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  required={formData.user_role === 1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your company name"
                />
              </div>
            )}

            {user?.wallet?.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={user.wallet.address}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 text-xs"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={
                isLoading ||
                !formData.name.trim() ||
                (formData.user_role === 1 && !formData.company.trim())
              }
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              {isLoading ? "Saving..." : "Complete Registration"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
