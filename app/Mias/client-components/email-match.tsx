'use client';

import { useState, useEffect, ChangeEvent } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailMatchProps {
  onEmailMatch: (email: string | null) => void;
  className?: string;
  showErrors?: boolean;
}

export function EmailMatch({ onEmailMatch, className = "", showErrors = false }: EmailMatchProps) {
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email1 && !email2) {
      setError(null);
      onEmailMatch(null);
      return;
    }

    if (!email1 || !email2) {
      if (showErrors) {
        setError("Please enter both email addresses");
      }
      onEmailMatch(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email1) || !emailRegex.test(email2)) {
      if (showErrors) {
        setError("Please enter valid email addresses");
      }
      onEmailMatch(null);
      return;
    }

    if (email1.toLowerCase() !== email2.toLowerCase()) {
      if (showErrors) {
        setError("Email addresses do not match");
      }
      onEmailMatch(null);
      return;
    }

    setError(null);
    onEmailMatch(email1.toLowerCase());
  }, [email1, email2, onEmailMatch, showErrors]);

  const handleEmail1Change = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail1(e.target.value);
  };

  const handleEmail2Change = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail2(e.target.value);
  };

  return (
    <form noValidate className={`space-y-4 ${className}`}>
      <div className="space-y-2">
        <Label htmlFor="email1">Email Address</Label>
        <Input
          id="email1"
          type="email"
          placeholder="Enter your email"
          value={email1}
          onChange={handleEmail1Change}
          className={showErrors && error ? "border-red-500" : ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email2">Confirm Email Address</Label>
        <Input
          id="email2"
          type="email"
          placeholder="Confirm your email"
          value={email2}
          onChange={handleEmail2Change}
          className={showErrors && error ? "border-red-500" : ""}
        />
      </div>
      {showErrors && error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </form>
  );
} 