import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, emails will not be sent')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const resend = getResend()
  if (!resend) return

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@bismillah-bazaar.com',
      to: email,
      subject: 'Reset your Bismillah Bazaar password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Bismillah Bazaar</h2>
          <p>You requested to reset your password. Click the button below to set a new password:</p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send password reset email:', error)
  }
}

export async function sendDeliveryReceipt(
  email: string,
  orderNumber: string,
  order: any,
  items: any[]
) {
  const resend = getResend()
  if (!resend) return

  try {
    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.item.item_name || item.itemName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.requested_kg || item.requestedKg} kg</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.fulfilled_kg || item.fulfilledKg || item.requested_kg || item.requestedKg} kg</td>
        </tr>
      `
      )
      .join('')

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@bismillah-bazaar.com',
      to: email,
      subject: `Delivery Confirmation & Invoice #${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Bismillah Bazaar</h2>
          <h3>Delivery Confirmation & Invoice #${orderNumber}</h3>
          <p>Your order has been delivered on ${new Date(order.delivered_at || order.deliveredAt).toLocaleDateString()}.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f9fafb;">
                <th style="padding: 8px; text-align: left; border-bottom: 2px solid #e5e7eb;">Item</th>
                <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Requested</th>
                <th style="padding: 8px; text-align: center; border-bottom: 2px solid #e5e7eb;">Fulfilled</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Total Amount:</strong> $${Number(order.final_total || order.finalTotal || order.original_total || order.originalTotal).toFixed(2)}</p>
            <p style="margin: 8px 0 0 0;"><strong>Payment Status:</strong> ${(order.payment_status || order.paymentStatus || 'unpaid').toUpperCase()}</p>
            ${(order.due_date || order.dueDate) ? `<p style="margin: 8px 0 0 0;"><strong>Payment Due:</strong> ${new Date(order.due_date || order.dueDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <p style="color: #059669; font-weight: bold;">Payment Instructions:</p>
          <p>Please send Interac e-Transfer to <strong>info@halalbutcher.com</strong> referencing <strong>#${orderNumber}</strong>.</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">Thank you for ordering from Bismillah Bazaar!</p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Failed to send delivery receipt:', error)
  }
}
