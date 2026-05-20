import { NextResponse } from 'next/server';
import { escapeHtml, isValidEmail, sendSellerEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, email } = body;
    const timestamp = new Date().toISOString();

    // Validate required fields
    if (!message || !email || !isValidEmail(String(email))) {
      console.error('Missing required fields:', { message, email });
      return NextResponse.json(
        { error: 'Valid message and email are required' },
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

    let emailContent;
    let emailSubject;
    const safeEmail = escapeHtml(String(email).toLowerCase());
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

    // Handle cart contact (multiple items)
    if (body.items && Array.isArray(body.items)) {
      const itemsList = body.items.map((item: { id: number; card_id?: string; product_id?: string; card?: string; product_name?: string; price: number }) => `
        <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
          <p><strong>ID:</strong> ${escapeHtml(item.id)}</p>
          <p><strong>Name:</strong> ${escapeHtml(item.card || item.product_name || 'Unknown')}</p>
          <p><strong>Card ID:</strong> ${escapeHtml(item.card_id || 'N/A')}</p>
          <p><strong>Product ID:</strong> ${escapeHtml(item.product_id || 'N/A')}</p>
          <p><strong>Price:</strong> $${item.price.toFixed(2)}</p>
        </div>
      `).join('');

      emailSubject = `New Cart Contact Request - ${body.items.length} Items`;
      emailContent = `
        <h2>New Cart Contact Request</h2>
        <p><strong>Customer Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
        <h3>Items (${body.items.length}):</h3>
        ${itemsList}
        <p><strong>Total Amount:</strong> $${body.totalAmount.toFixed(2)}</p>
        <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
      `;
    }
    // Handle single item contact
    else {
      emailSubject = `New Contact Request for Item #${body.id}`;
      emailContent = `
        <h2>New Contact Request</h2>
        <p><strong>Customer Email:</strong> ${safeEmail}</p>
        <p><strong>Message:</strong></p>
        <p>${safeMessage}</p>
        <div style="margin: 20px 0; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
          <p><strong>ID:</strong> ${escapeHtml(body.id)}</p>
          <p><strong>Name:</strong> ${escapeHtml(body.card || body.product_name || 'Unknown')}</p>
          <p><strong>Card ID:</strong> ${escapeHtml(body.card_id || 'N/A')}</p>
          <p><strong>Product ID:</strong> ${escapeHtml(body.product_id || 'N/A')}</p>
          <p><strong>Price:</strong> $${body.price.toFixed(2)}</p>
        </div>
        <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
      `;
    }

    await sendSellerEmail({
      subject: emailSubject,
      html: emailContent,
      replyTo: String(email).toLowerCase(),
    });

    return NextResponse.json(
      { message: 'Contact request received successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing contact request:', error);
    
    // Return more specific error messages
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Failed to send message',
          details: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 