"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const user = null;

  return (
    <div className=" text-gray-200 flex flex-col justify-center items-center bg-gradient-to-br from-blue-200 from-10% via-blue-300 to-blue-400 min-h-screen">
      <section className="min-h-screen flex items-center justify-center flex-col">
        <div className="space-y-8">
          <h1 className="text-6xl md:text-7xl font-extrabold leading-tight text-gray-200">
            Welcome to the Future of{" "}
            <span className="block bg-clip-text bg-gradient-to-r text-blue-800">
              Decentralized Governance
            </span>
          </h1>
          <p className="text-2xl text-gray-200">
            A Decentralized Autonomous Organization on Solana supporting
            regenerative businesses through community governance and quadratic
            funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant={"default"} className="h-16 w-52 text-xl">
              Get Started →
            </Button>
            <Button
              variant={"outline"}
              className="h-16 w-52 text-xl bg-transparent border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white"
              onClick={() => (window.location.href = "/projects")}
            >
              Browse Projects
            </Button>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 w-full">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4 text-gray-200">
              ACTS Governance Token
            </h2>
            <p className="text-xl text-gray-300">
              The heart of Anectos DAO governance with 18+ billion tokens in
              circulation
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-transparent text-gray-300 py-16 px-6">
        <p className="mt-12 pt-8 text-center">
          © {new Date().getFullYear()} Anectos DAO. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
