// Supabase Edge Function для отправки email уведомления о заказе
// Использует Resend API для отправки писем

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_CHAT_IDS = Deno.env.get('TELEGRAM_CHAT_IDS') // Comma separated IDs
const FROM_EMAIL = 'orders@o-n-r.ru'
const ADMIN_EMAIL = 'info@o-n-r.ru'

interface OrderData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerCity: string
  trailerName?: string
  trailerModel?: string
  trailerPrice?: number
  accessories?: Array<{ name: string; price: number }>
  totalPrice?: number
  deliveryMethod?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const orderData: OrderData = await req.json()

    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerEmailHtml = generateCustomerEmail(orderData)
    const adminEmailHtml = generateAdminEmail(orderData)

    if (orderData.customerEmail) {
      await sendEmail({
        to: orderData.customerEmail,
        subject: `Заказ ${orderData.orderNumber} оформлен — Охота на рыбалку`,
        html: customerEmailHtml,
      })
    }

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Новый заказ ${orderData.orderNumber} от ${orderData.customerName}`,
      html: adminEmailHtml,
    })

    // Отправка уведомления в Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_IDS) {
      const chatIds = TELEGRAM_CHAT_IDS.split(',').map(id => id.trim()).filter(id => id)
      const telegramMessage = generateTelegramMessage(orderData)
      
      // Отправляем всем получателям параллельно
      await Promise.all(chatIds.map(chatId => 
        sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, telegramMessage)
      ))
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Notifications sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    throw new Error(`Failed to send email: ${errorData}`)
  }
  return response.json()
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU').format(price)
}

function generateCustomerEmail(data: OrderData): string {
  const accessoriesHtml = data.accessories?.length
    ? data.accessories.map(acc => `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${acc.name}</td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatPrice(acc.price)} RUB</td></tr>`).join('')
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">Спасибо за заказ!</h1>
      <p style="color: #93c5fd; margin: 8px 0 0;">Сеть магазинов Охота на рыбалку</p>
    </div>
    <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
      <p style="font-size: 18px; margin: 0 0 16px;">Здравствуйте, ${data.customerName}!</p>
      <p>Ваш заказ <strong style="color: #1e40af;">${data.orderNumber}</strong> успешно оформлен.</p>
      <div style="background: #f0f9ff; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h2 style="color: #1e40af; margin: 0 0 16px; font-size: 18px;">Состав заказа:</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${data.trailerName ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>${data.trailerModel || 'Прицеп'}</strong><br><span style="color: #6b7280; font-size: 14px;">${data.trailerName}</span></td><td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; text-align: right; white-space: nowrap;">${formatPrice(data.trailerPrice || 0)} RUB</td></tr>` : ''}
          ${accessoriesHtml}
        </table>
        <div style="border-top: 2px solid #1e40af; margin-top: 16px; padding-top: 16px;">
          <span style="font-size: 18px; font-weight: bold;">Итого:</span>
          <span style="font-size: 24px; font-weight: bold; color: #1e40af; float: right;">${formatPrice(data.totalPrice || 0)} RUB</span>
        </div>
      </div>
      <div style="background: #fef3c7; border-radius: 12px; padding: 16px; margin: 24px 0;">
        <p style="margin: 0; color: #92400e;"><strong>Что дальше?</strong><br>Наш менеджер свяжется с вами в ближайшее время для подтверждения заказа.</p>
      </div>
      <p style="margin: 0 0 8px;"><strong>Способ получения:</strong> ${data.deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка'}</p>
      <p style="margin: 0;"><strong>Город:</strong> ${data.customerCity}</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <p style="margin: 0; color: #6b7280; font-size: 14px;">Отследить статус заказа:<br><a href="https://mzsa-gem-monolith-production.up.railway.app/track?order=${data.orderNumber}" style="color: #1e40af;">Перейти к отслеживанию</a></p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <div style="text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 0 0 8px;"><strong>Контакты:</strong></p>
        <p style="margin: 0;">+7 (3462) 22-33-55 | info@o-n-r.ru | o-n-r.ru</p>
      </div>
    </div>
  </div>
</body></html>`
}

function generateAdminEmail(data: OrderData): string {
  const accessoriesList = data.accessories?.length
    ? data.accessories.map(acc => `- ${acc.name} - ${formatPrice(acc.price)} RUB`).join('\n')
    : 'Нет'

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 20px; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #dc2626; margin: 0 0 24px; font-size: 20px;">Новый заказ ${data.orderNumber}</h1>
    <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px;">Клиент:</h2>
    <ul style="margin: 0 0 24px; padding-left: 20px;">
      <li><strong>Имя:</strong> ${data.customerName}</li>
      <li><strong>Телефон:</strong> <a href="tel:${data.customerPhone}">${data.customerPhone}</a></li>
      <li><strong>Email:</strong> ${data.customerEmail || 'Не указан'}</li>
      <li><strong>Город:</strong> ${data.customerCity}</li>
    </ul>
    <h2 style="font-size: 16px; color: #374151; margin: 0 0 12px;">Заказ:</h2>
    <ul style="margin: 0 0 24px; padding-left: 20px;">
      <li><strong>Прицеп:</strong> ${data.trailerModel || 'Не выбран'} - ${data.trailerName || ''}</li>
      <li><strong>Цена прицепа:</strong> ${formatPrice(data.trailerPrice || 0)} RUB</li>
      <li><strong>Опции:</strong><br><pre style="margin: 4px 0; font-family: inherit;">${accessoriesList}</pre></li>
      <li><strong>Способ получения:</strong> ${data.deliveryMethod === 'pickup' ? 'Самовывоз' : 'Доставка'}</li>
    </ul>
    <div style="background: #fee2e2; border-radius: 8px; padding: 16px; text-align: center;">
      <span style="font-size: 14px; color: #991b1b;">ИТОГО:</span>
      <span style="font-size: 24px; font-weight: bold; color: #dc2626; margin-left: 8px;">${formatPrice(data.totalPrice || 0)} RUB</span>
    </div>
    <p style="margin: 24px 0 0; text-align: center;">
      <a href="https://mzsa-gem-monolith-production.up.railway.app/admin#/orders" style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Открыть в админке</a>
    </p>
  </div>
</body></html>`
}

function generateTelegramMessage(data: OrderData): string {
  const accessoriesList = data.accessories?.length
    ? data.accessories.map(acc => `• ${acc.name}`).join('\n')
    : 'Нет'

  return `
🔥 <b>Новый заказ ${data.orderNumber}</b>

👤 <b>Клиент:</b>
${data.customerName}
📞 ${data.customerPhone}
${data.customerEmail ? `📧 ${data.customerEmail}` : ''}
📍 ${data.customerCity}

🚛 <b>Прицеп:</b>
${data.trailerModel || 'Не выбран'}
${data.trailerName || ''}

🛠 <b>Опции:</b>
${accessoriesList}

📦 <b>Получение:</b> ${data.deliveryMethod === 'delivery' ? 'Доставка' : 'Самовывоз'}

💰 <b>Итого: ${formatPrice(data.totalPrice || 0)} ₽</b>
  `.trim()
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML',
    }),
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error(`Failed to send Telegram message to ${chatId}: ${errorData}`)
    // Don't throw error to prevent blocking other notifications
  }
  return response.json()
}
