import { Resend } from 'resend'

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, emails will not be sent')
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.EMAIL_FROM || 'noreply@bismillah-bazaar.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bismillah-bazaar-production.up.railway.app'

function basewrap(title: string, body: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669; margin-bottom: 8px;">Bismillah Bazaar</h2>
      <p style="color: #999; font-size: 11px; margin-top: 0;">100% Halal Wholesale</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
      ${body}
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 12px;" />
      <p style="color: #999; font-size: 11px;">Bismillah Bazaar — Wholesale Halal Meat</p>
    </div>
  `
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const resend = getResend()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Reset your Bismillah Bazaar password',
      html: basewrap('Reset Password', `
        <p style="font-size: 15px;">You requested to reset your password. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 14px;">Reset Password</a>
        <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      `),
    })
  } catch (error) {
    console.error('Failed to send password reset email:', error)
  }
}

export async function sendAccountApprovedEmail(email: string, restaurantName: string) {
  const resend = getResend()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Your Bismillah Bazaar account has been approved!',
      html: basewrap('Account Approved', `
        <p style="font-size: 15px;">Hi ${restaurantName || 'there'},</p>
        <p style="font-size: 15px;">Great news! Your restaurant account has been approved. You can now browse our catalog and place wholesale halal meat orders.</p>
        <a href="${APP_URL}/catalog" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-size: 14px;">Browse Catalog</a>
        <p style="color: #666; font-size: 14px;">If you have any questions, reply to this email.</p>
      `),
    })
  } catch (error) {
    console.error('Failed to send account approved email:', error)
  }
}

export async function sendAccountRejectedEmail(email: string, restaurantName: string) {
  const resend = getResend()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: 'Update on your Bismillah Bazaar account',
      html: basewrap('Account Update', `
        <p style="font-size: 15px;">Hi ${restaurantName || 'there'},</p>
        <p style="font-size: 15px;">Unfortunately, your restaurant account registration was not approved at this time. This may be due to incomplete information or eligibility requirements.</p>
        <p style="font-size: 15px;">If you believe this is an error, please reply to this email and we'll review your case.</p>
        <p style="color: #666; font-size: 14px;">Thank you for your interest in Bismillah Bazaar.</p>
      `),
    })
  } catch (error) {
    console.error('Failed to send account rejected email:', error)
  }
}

export async function sendNewRegistrationEmail(
  adminEmails: string[],
  restaurantName: string,
  customerEmail: string,
  phone: string | null,
  location: string | null,
) {
  const resend = getResend()
  if (!resend) return

  const details = [
    phone && `<strong>Phone:</strong> ${phone}`,
    location && `<strong>Location:</strong> ${location}`,
  ].filter(Boolean).join('<br/>')

  try {
    await resend.emails.send({
      from: FROM,
      to: adminEmails,
      subject: `New restaurant registered: ${restaurantName}`,
      html: basewrap('New Registration', `
        <p style="font-size: 15px;">A new restaurant has registered and is waiting for approval.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Restaurant:</strong> ${restaurantName}</p>
          <p style="margin: 4px 0 0 0;"><strong>Email:</strong> ${customerEmail}</p>
          ${details ? `<p style="margin: 4px 0 0 0;">${details}</p>` : ''}
        </div>
        <a href="${APP_URL}/admin" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-size: 14px;">Review in Admin</a>
      `),
    })
  } catch (error) {
    console.error('Failed to send new registration email:', error)
  }
}

export async function sendOrderPlacedEmail(
  email: string,
  restaurantName: string,
  orderNumber: string,
  items: { name: string; quantity: number }[],
  total: number,
) {
  const resend = getResend()
  if (!resend) return

  const itemsHtml = items
    .map((i) => `<li style="padding: 4px 0;">${i.name} — ${i.quantity} lb</li>`)
    .join('')

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Order Confirmed — #${orderNumber}`,
      html: basewrap('Order Placed', `
        <p style="font-size: 15px;">Hi ${restaurantName || 'there'},</p>
        <p style="font-size: 15px;">Your order <strong>#${orderNumber}</strong> has been placed successfully.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0 0 8px;"><strong>Items:</strong></p>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px;">${itemsHtml}</ul>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;" />
          <p style="margin: 0; font-size: 16px;"><strong>Estimated Total:</strong> $${total.toFixed(2)}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Our team will review your order and confirm final pricing shortly. You'll receive an email when your order is confirmed.</p>
      `),
    })
  } catch (error) {
    console.error('Failed to send order placed email:', error)
  }
}

export async function sendNewOrderAlertEmail(
  adminEmails: string[],
  restaurantName: string,
  orderNumber: string,
  itemCount: number,
  total: number,
) {
  const resend = getResend()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM,
      to: adminEmails,
      subject: `New order from ${restaurantName} — #${orderNumber}`,
      html: basewrap('New Order', `
        <p style="font-size: 15px;"><strong>${restaurantName}</strong> just placed a new order.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Order:</strong> #${orderNumber}</p>
          <p style="margin: 4px 0 0 0;"><strong>Items:</strong> ${itemCount}</p>
          <p style="margin: 4px 0 0 0;"><strong>Estimated Total:</strong> $${total.toFixed(2)}</p>
        </div>
        <a href="${APP_URL}/admin" style="display: inline-block; background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0; font-size: 14px;">Review Order</a>
      `),
    })
  } catch (error) {
    console.error('Failed to send new order alert email:', error)
  }
}

export async function sendOrderConfirmedEmail(
  email: string,
  restaurantName: string,
  orderNumber: string,
  finalTotal: number,
) {
  const resend = getResend()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Order #${orderNumber} confirmed`,
      html: basewrap('Order Confirmed', `
        <p style="font-size: 15px;">Hi ${restaurantName || 'there'},</p>
        <p style="font-size: 15px;">Your order <strong>#${orderNumber}</strong> has been confirmed by our team.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0; font-size: 16px;"><strong>Final Total:</strong> $${finalTotal.toFixed(2)}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Please send Interac e-Transfer to <strong>info@halalbutcher.com</strong> referencing <strong>#${orderNumber}</strong>.</p>
        <p style="color: #666; font-size: 14px;">You'll receive another email once your order has been delivered.</p>
      `),
    })
  } catch (error) {
    console.error('Failed to send order confirmed email:', error)
  }
}

export async function sendOrderModifiedEmail(
  email: string,
  restaurantName: string,
  orderNumber: string,
  changes: string[],
  newTotal: number,
) {
  const resend = getResend()
  if (!resend) return

  const changesHtml = changes
    .map((c) => `<li style="padding: 2px 0;">${c}</li>`)
    .join('')

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Order #${orderNumber} has been updated`,
      html: basewrap('Order Updated', `
        <p style="font-size: 15px;">Hi ${restaurantName || 'there'},</p>
        <p style="font-size: 15px;">Your order <strong>#${orderNumber}</strong> has been updated by our team.</p>
        <div style="background: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0 0 8px;"><strong>Changes:</strong></p>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px;">${changesHtml}</ul>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 12px 0;" />
          <p style="margin: 0; font-size: 16px;"><strong>Updated Total:</strong> $${newTotal.toFixed(2)}</p>
        </div>
        <p style="color: #666; font-size: 14px;">Please review the changes. You can also edit the order from your dashboard.</p>
      `),
    })
  } catch (error) {
    console.error('Failed to send order modified email:', error)
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
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.requested_kg || item.requestedKg} lb</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.fulfilled_kg || item.fulfilledKg || item.requested_kg || item.requestedKg} lb</td>
        </tr>
      `
      )
      .join('')

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Delivery Confirmation & Invoice #${orderNumber}`,
      html: basewrap('Delivery Confirmation', `
        <p style="font-size: 15px;">Your order <strong>#${orderNumber}</strong> has been delivered on ${new Date(order.delivered_at || order.deliveredAt).toLocaleDateString()}.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
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
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Total Amount:</strong> $${Number(order.final_total || order.finalTotal || order.original_total || order.originalTotal).toFixed(2)}</p>
          <p style="margin: 8px 0 0 0;"><strong>Payment Status:</strong> ${(order.payment_status || order.paymentStatus || 'unpaid').toUpperCase()}</p>
          ${(order.due_date || order.dueDate) ? `<p style="margin: 8px 0 0 0;"><strong>Payment Due:</strong> ${new Date(order.due_date || order.dueDate).toLocaleDateString()}</p>` : ''}
        </div>
        <p style="color: #059669; font-weight: bold;">Payment Instructions:</p>
        <p style="font-size: 14px;">Please send Interac e-Transfer to <strong>info@halalbutcher.com</strong> referencing <strong>#${orderNumber}</strong>.</p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">Thank you for ordering from Bismillah Bazaar!</p>
      `),
    })
  } catch (error) {
    console.error('Failed to send delivery receipt:', error)
  }
}
