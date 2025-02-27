"use client";

import { HiMenu } from "react-icons/hi";
import { useState } from "react";
import { WalletMultiButtonDynamic } from "./WalletConnect";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <nav className="text-white sticky top-0 z-20 justify-between items-center border-b border-[#FF1493] bg-transparent backdrop-blur-md p-4 flex">
        <h1 className="text-green-400 text-3xl font-bold pl-10">Anectos</h1>
        <div className="flex justify-center items-center space-x-8 text-[20px] pr-[70px] font-normal">
          <WalletMultiButtonDynamic />
        </div>
      </nav>
    </>
  );
}
