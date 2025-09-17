"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const user = null;
  const route = useRouter();

  return (
    <div className="text-gray-200 bg-gradient-to-br from-blue-200 from-10% via-blue-300 to-blue-400 min-h-[100dvh] h-[100dvh] overflow-hidden flex flex-col">
      <section className="flex-1 flex items-center justify-center px-6">
        <div className="space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-gray-800 text-center">
            Welcome to the Future of{" "}
            <span className="block bg-clip-text bg-gradient-to-r  font-extrabold text-blue-800">
              Decentralized Governance
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 text-center max-w-3xl">
            A Decentralized Autonomous Organization on Solana supporting
            regenerative businesses through community governance and quadratic
            funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              className="w-56 text-xl h-12 bg-blue-700 hover:bg-blue-800 text-white"
              onClick={() => route.push("/profile")}
            >
              Get Started →
            </button>
            <button
              className="w-56 text-xl h-12  border-blue-500 bg-blue-200 text-blue-700 hover:bg-blue-500 hover:text-white"
              onClick={() => route.push("/projects")}
            >
              Browse Projects
            </button>
          </div>
        </div>
      </section>

      <footer className="bg-transparent text-gray-300 px-6 mt-auto py-4">
        <p className="text-center">
          © {new Date().getFullYear()} Sean Hoe. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
