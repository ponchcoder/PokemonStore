'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function QADialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [question, setQuestion] = useState('');
  const [email, setEmail] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!question.trim()) {
      toast.error('Please enter your question');
      return;
    }

    try {
      const response = await fetch('/api/submit-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send question');
      }

      setRequestId(data.requestId);
      setStatus('success');
      toast.success('Question sent successfully!', {
        duration: 3000,
        position: 'top-center',
      });
      
      // Close the dialog after a short delay
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
        setEmail('');
        setQuestion('');
        setRequestId(null);
      }, 3000);
    } catch (error) {
      console.error('Error sending question:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send question');
      toast.error('Failed to send question. Please try again.', {
        duration: 3000,
        position: 'top-center',
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="text-white hover:text-gray-900 px-2 py-1 md:px-3 md:py-2 rounded-md text-sm md:text-base font-medium nav-link whitespace-nowrap cursor-pointer"
      >
        Q&A
      </Button>
      <Dialog open={isOpen} onOpenChange={(newOpen) => {
        if (!newOpen) {
          setStatus('idle');
          setErrorMessage('');
          setEmail('');
          setQuestion('');
          setRequestId(null);
        }
        setIsOpen(newOpen);
      }}>
        <DialogContent className="sm:max-w-[800px] bg-gradient-to-br from-zinc-700 via-zinc-600 to-zinc-500 shadow-lg rounded-lg border border-gray-300">
          <DialogHeader>
            <DialogTitle className="text-white">Ask a Question</DialogTitle>
            <DialogDescription className="text-md text-white">
              Have a question? I&apos;m here to help! Fill out the form below and I&apos;ll get back to you.
            </DialogDescription>
          </DialogHeader>
          
          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Question Sent Successfully!</h3>
              <p className="text-white text-center">Thank you for your question. I&apos;ll respond as soon as possible.</p>
              {requestId && (
                <p className="text-sm text-gray-300 mt-2">Reference ID: {requestId}</p>
              )}
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Failed to Send Question</h3>
              <p className="text-white text-center mb-4">{errorMessage}</p>
              <Button
                onClick={() => {
                  setStatus('idle');
                  setErrorMessage('');
                }}
                className="mt-4 px-4 py-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white rounded-md transition-colors"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white" htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-200 bg-white rounded-md focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-white mb-1">
                  Your Question
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  required
                  rows={4}
                  className="w-full px-3 py-2 bg-white border border-zinc-700 rounded-md placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Type your question here..."
                />
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full px-4 py-2 bg-purple-700 hover:bg-purple-800 active:bg-purple-900 text-white rounded-md transition-colors"
              >
                Send Question
              </Button>
            </div>
          )}
          <p className="text-sm text-white">We&apos;ll get back to you as soon as possible.</p>
          <p className="text-sm text-white">Your question might help others too!</p>
        </DialogContent>
      </Dialog>
    </>
  );
} 