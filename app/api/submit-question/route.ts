import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { escapeHtml, isValidEmail, sendSellerEmail } from '@/lib/email';

interface QuestionRequest {
  email: string;
  question: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'completed';
  id: string;
}

export async function POST(request: Request) {
  try {
    const { email, question } = await request.json();

    if (!email || !question || !isValidEmail(String(email))) {
      return NextResponse.json(
        { error: 'Valid email and question are required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.PONCHOS_EMAIL_USER || !process.env.PONCHOS_EMAIL_PASSWORD || !process.env.PONCHOS_SELLER_EMAIL) {
      console.error('Missing environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const dataDir = path.join(process.cwd(), 'data');
    const filePath = path.join(dataDir, 'questions.json');

    // Create data directory if it doesn't exist
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // Read existing data or initialize empty array
    let questions: QuestionRequest[] = [];
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      questions = JSON.parse(fileContent);
    } catch {
      // File doesn't exist or is empty, start with empty array
    }

    // Create new question request
    const newQuestion: QuestionRequest = {
      email,
      question,
      timestamp: new Date().toISOString(),
      status: 'pending',
      id: `Q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    // Add new question to array
    questions.push(newQuestion);

    // Write updated data back to file
    await fs.writeFile(filePath, JSON.stringify(questions, null, 2));

    // Send email notification
    await sendSellerEmail({
      subject: `New Question - ${newQuestion.id}`,
      replyTo: email,
      html: `
        <h2>New Question Received</h2>
        <p><strong>Request ID:</strong> ${escapeHtml(newQuestion.id)}</p>
        <p><strong>From:</strong> ${escapeHtml(email)}</p>
        <p><strong>Question:</strong></p>
        <p>${escapeHtml(question).replace(/\n/g, '<br />')}</p>
        <p><strong>Timestamp:</strong> ${new Date(newQuestion.timestamp).toLocaleString()}</p>
      `
    });

    return NextResponse.json({
      success: true,
      requestId: newQuestion.id
    });

  } catch (error) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'questions.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const questions: QuestionRequest[] = JSON.parse(fileContent);

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error reading questions:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve questions' },
      { status: 500 }
    );
  }
} 