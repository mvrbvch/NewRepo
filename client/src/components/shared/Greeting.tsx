import React, { useState, useEffect } from "react";

interface GreetingProps {
  user: string;
  partnerName: string;
}

export default function Greeting({ user, partnerName }: GreetingProps) {
  const [today, setToday] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setToday(now.toLocaleDateString("pt-BR", options));
  }, []);

  return (
    <div className="px-4 py-6 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg mb-6">
      <h1 className="text-2xl font-bold mb-1">Olá, {user}</h1>
      <p className="text-gray-600 mb-4">{today}</p>
      <div className="flex items-center gap-1">
        <p className="text-gray-700">
          <span className="font-semibold">{partnerName}</span> e você já se
          escolheram hoje?
        </p>
        <span className="text-xl">💖</span>
      </div>
    </div>
  );
}
