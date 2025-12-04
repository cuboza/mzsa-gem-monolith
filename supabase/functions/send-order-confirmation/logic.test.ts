import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  formatPrice,
  generateCustomerEmail,
  generateAdminEmail,
  generateTelegramMessage,
  parseChatIds,
  validateOrderData,
  sendEmail,
  sendTelegramMessage,
  CORS_HEADERS,
  FROM_EMAIL,
  ADMIN_EMAIL,
  BASE_URL,
  type OrderData,
} from './logic'

// Тестовые данные
const createTestOrder = (overrides: Partial<OrderData> = {}): OrderData => ({
  orderNumber: 'ORD-2024-001',
  customerName: 'Иван Петров',
  customerEmail: 'ivan@example.com',
  customerPhone: '+7 (999) 123-45-67',
  customerCity: 'Сургут',
  trailerName: 'Прицеп для перевозки лодки',
  trailerModel: 'МЗСА 817711.022',
  trailerPrice: 150000,
  accessories: [
    { name: 'Тент', price: 5000 },
    { name: 'Запасное колесо', price: 3000 },
  ],
  totalPrice: 158000,
  deliveryMethod: 'pickup',
  ...overrides,
})

describe('Константы', () => {
  it('должны иметь корректные CORS заголовки', () => {
    expect(CORS_HEADERS).toEqual({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    })
  })

  it('должны иметь корректный email отправителя', () => {
    expect(FROM_EMAIL).toBe('orders@o-n-r.ru')
  })

  it('должны иметь корректный email админа', () => {
    expect(ADMIN_EMAIL).toBe('info@o-n-r.ru')
  })

  it('должны иметь корректный базовый URL', () => {
    expect(BASE_URL).toBe('https://spricepom.ru')
  })
})

describe('formatPrice', () => {
  it('должна форматировать целые числа с разделителями тысяч', () => {
    // Intl.NumberFormat использует неразрывный пробел (U+00A0)
    expect(formatPrice(1000)).toBe('1\u00A0000')
    expect(formatPrice(1000000)).toBe('1\u00A0000\u00A0000')
    expect(formatPrice(150000)).toBe('150\u00A0000')
  })

  it('должна обрабатывать ноль', () => {
    expect(formatPrice(0)).toBe('0')
  })

  it('должна обрабатывать маленькие числа', () => {
    expect(formatPrice(100)).toBe('100')
    expect(formatPrice(5)).toBe('5')
  })

  it('должна обрабатывать дробные числа', () => {
    // Intl.NumberFormat использует неразрывный пробел (U+00A0) и запятую
    expect(formatPrice(1500.5)).toBe('1\u00A0500,5')
    expect(formatPrice(99.99)).toBe('99,99')
  })
})

describe('generateCustomerEmail', () => {
  it('должна генерировать HTML-письмо с данными клиента', () => {
    const order = createTestOrder()
    const html = generateCustomerEmail(order)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain(order.customerName)
    expect(html).toContain(order.orderNumber)
    expect(html).toContain(order.customerCity)
  })

  it('должна содержать информацию о прицепе', () => {
    const order = createTestOrder()
    const html = generateCustomerEmail(order)

    expect(html).toContain(order.trailerModel!)
    expect(html).toContain(order.trailerName!)
    // Intl.NumberFormat использует неразрывный пробел
    expect(html).toContain('150\u00A0000')
  })

  it('должна содержать аксессуары', () => {
    const order = createTestOrder()
    const html = generateCustomerEmail(order)

    expect(html).toContain('Тент')
    expect(html).toContain('5\u00A0000')
    expect(html).toContain('Запасное колесо')
    expect(html).toContain('3\u00A0000')
  })

  it('должна показывать "Самовывоз" для pickup', () => {
    const order = createTestOrder({ deliveryMethod: 'pickup' })
    const html = generateCustomerEmail(order)

    expect(html).toContain('Самовывоз')
  })

  it('должна показывать "Доставка" для delivery', () => {
    const order = createTestOrder({ deliveryMethod: 'delivery' })
    const html = generateCustomerEmail(order)

    expect(html).toContain('Доставка')
  })

  it('должна содержать ссылку на отслеживание', () => {
    const order = createTestOrder()
    const html = generateCustomerEmail(order)

    expect(html).toContain(`${BASE_URL}/track?order=${order.orderNumber}`)
    expect(html).toContain('Перейти к отслеживанию')
  })

  it('должна работать без прицепа', () => {
    const order = createTestOrder({
      trailerName: undefined,
      trailerModel: undefined,
      trailerPrice: undefined,
    })
    const html = generateCustomerEmail(order)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain(order.customerName)
  })

  it('должна работать без аксессуаров', () => {
    const order = createTestOrder({ accessories: [] })
    const html = generateCustomerEmail(order)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).not.toContain('Тент')
  })

  it('должна использовать "Прицеп" как fallback для модели', () => {
    const order = createTestOrder({
      trailerName: 'Тест',
      trailerModel: undefined,
    })
    const html = generateCustomerEmail(order)

    expect(html).toContain('Прицеп')
  })

  it('должна содержать контактную информацию', () => {
    const html = generateCustomerEmail(createTestOrder())

    expect(html).toContain('+7 (3462) 22-33-55')
    expect(html).toContain('info@o-n-r.ru')
    expect(html).toContain('o-n-r.ru')
  })

  it('должна форматировать нулевую цену прицепа', () => {
    const order = createTestOrder({
      trailerName: 'Тест',
      trailerPrice: 0,
    })
    const html = generateCustomerEmail(order)
    
    expect(html).toContain('0 RUB')
  })

  it('должна форматировать нулевую итоговую сумму', () => {
    const order = createTestOrder({ totalPrice: 0 })
    const html = generateCustomerEmail(order)
    
    expect(html).toContain('0 RUB')
  })

  it('должна работать с undefined accessories', () => {
    const order = createTestOrder({ accessories: undefined })
    const html = generateCustomerEmail(order)
    
    expect(html).toContain('<!DOCTYPE html>')
  })
})

describe('generateAdminEmail', () => {
  it('должна генерировать HTML-письмо для админа', () => {
    const order = createTestOrder()
    const html = generateAdminEmail(order)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain(`Новый заказ ${order.orderNumber}`)
  })

  it('должна содержать данные клиента', () => {
    const order = createTestOrder()
    const html = generateAdminEmail(order)

    expect(html).toContain(order.customerName)
    expect(html).toContain(order.customerPhone)
    expect(html).toContain(order.customerEmail)
    expect(html).toContain(order.customerCity)
  })

  it('должна содержать телефонную ссылку', () => {
    const order = createTestOrder()
    const html = generateAdminEmail(order)

    expect(html).toContain(`href="tel:${order.customerPhone}"`)
  })

  it('должна содержать информацию о заказе', () => {
    const order = createTestOrder()
    const html = generateAdminEmail(order)

    expect(html).toContain(order.trailerModel!)
    expect(html).toContain(order.trailerName!)
    expect(html).toContain('Тент')
    expect(html).toContain('Запасное колесо')
  })

  it('должна содержать итоговую сумму', () => {
    const order = createTestOrder()
    const html = generateAdminEmail(order)

    // Intl.NumberFormat использует неразрывный пробел
    expect(html).toContain('158\u00A0000')
    expect(html).toContain('ИТОГО')
  })

  it('должна содержать ссылку на админку', () => {
    const html = generateAdminEmail(createTestOrder())

    expect(html).toContain(`${BASE_URL}/admin#/orders`)
    expect(html).toContain('Открыть в админке')
  })

  it('должна показывать "Не указан" для email если пустой', () => {
    const order = createTestOrder({ customerEmail: '' })
    const html = generateAdminEmail(order)

    expect(html).toContain('Не указан')
  })

  it('должна показывать "Нет" для пустых аксессуаров', () => {
    const order = createTestOrder({ accessories: [] })
    const html = generateAdminEmail(order)

    expect(html).toContain('Нет')
  })

  it('должна показывать "Не выбран" для прицепа без модели', () => {
    const order = createTestOrder({ trailerModel: undefined })
    const html = generateAdminEmail(order)

    expect(html).toContain('Не выбран')
  })

  it('должна показывать способ получения', () => {
    const pickup = generateAdminEmail(createTestOrder({ deliveryMethod: 'pickup' }))
    const delivery = generateAdminEmail(createTestOrder({ deliveryMethod: 'delivery' }))

    expect(pickup).toContain('Самовывоз')
    expect(delivery).toContain('Доставка')
  })

  it('должна обрабатывать пустое имя прицепа', () => {
    const order = createTestOrder({ trailerName: '' })
    const html = generateAdminEmail(order)
    
    expect(html).toContain('МЗСА 817711.022 -')
  })

  it('должна обрабатывать нулевую цену прицепа', () => {
    const order = createTestOrder({ trailerPrice: 0 })
    const html = generateAdminEmail(order)
    
    expect(html).toContain('0 RUB')
  })

  it('должна обрабатывать нулевую итоговую сумму', () => {
    const order = createTestOrder({ totalPrice: 0 })
    const html = generateAdminEmail(order)
    
    expect(html).toContain('0 RUB')
  })

  it('должна работать с undefined accessories', () => {
    const order = createTestOrder({ accessories: undefined })
    const html = generateAdminEmail(order)
    
    expect(html).toContain('Нет')
  })
})

describe('generateTelegramMessage', () => {
  it('должна генерировать сообщение с эмодзи', () => {
    const order = createTestOrder()
    const message = generateTelegramMessage(order)

    expect(message).toContain('🔥')
    expect(message).toContain('👤')
    expect(message).toContain('📞')
    expect(message).toContain('📍')
    expect(message).toContain('🚛')
    expect(message).toContain('🛠')
    expect(message).toContain('📦')
    expect(message).toContain('💰')
    expect(message).toContain('📋')
  })

  it('должна содержать HTML-теги для форматирования', () => {
    const order = createTestOrder()
    const message = generateTelegramMessage(order)

    expect(message).toContain('<b>')
    expect(message).toContain('</b>')
    expect(message).toContain('<a href=')
    expect(message).toContain('</a>')
  })

  it('должна содержать данные заказа', () => {
    const order = createTestOrder()
    const message = generateTelegramMessage(order)

    expect(message).toContain(order.orderNumber)
    expect(message).toContain(order.customerName)
    expect(message).toContain(order.customerPhone)
    expect(message).toContain(order.customerCity)
  })

  it('должна содержать email клиента если указан', () => {
    const order = createTestOrder()
    const message = generateTelegramMessage(order)

    expect(message).toContain('📧')
    expect(message).toContain(order.customerEmail)
  })

  it('не должна содержать email если не указан', () => {
    const order = createTestOrder({ customerEmail: '' })
    const message = generateTelegramMessage(order)

    expect(message).not.toContain('📧')
  })

  it('должна содержать информацию о прицепе', () => {
    const order = createTestOrder()
    const message = generateTelegramMessage(order)

    expect(message).toContain(order.trailerModel!)
    expect(message).toContain(order.trailerName!)
  })

  it('должна содержать список аксессуаров', () => {
    const order = createTestOrder()
    const message = generateTelegramMessage(order)

    expect(message).toContain('• Тент')
    expect(message).toContain('• Запасное колесо')
  })

  it('должна показывать "Нет" для пустых аксессуаров', () => {
    const order = createTestOrder({ accessories: [] })
    const message = generateTelegramMessage(order)

    expect(message).toContain('🛠 <b>Опции:</b>\nНет')
  })

  it('должна содержать способ получения', () => {
    const pickup = generateTelegramMessage(createTestOrder({ deliveryMethod: 'pickup' }))
    const delivery = generateTelegramMessage(createTestOrder({ deliveryMethod: 'delivery' }))

    expect(pickup).toContain('Самовывоз')
    expect(delivery).toContain('Доставка')
  })

  it('должна содержать итоговую сумму в рублях', () => {
    const order = createTestOrder()
    const message = generateTelegramMessage(order)

    // Intl.NumberFormat использует неразрывный пробел
    expect(message).toContain('158\u00A0000 ₽')
  })

  it('должна содержать ссылку на админку с фильтром', () => {
    const order = createTestOrder()
    const message = generateTelegramMessage(order)
    const expectedFilter = encodeURIComponent(JSON.stringify({ q: order.orderNumber }))

    expect(message).toContain(`${BASE_URL}/admin#/orders?filter=${expectedFilter}`)
    expect(message).toContain(`Открыть заказ ${order.orderNumber}`)
  })

  it('должна показывать "Не выбран" для прицепа без модели', () => {
    const order = createTestOrder({ trailerModel: undefined })
    const message = generateTelegramMessage(order)

    expect(message).toContain('Не выбран')
  })

  it('должна обрабатывать нулевую итоговую сумму', () => {
    const order = createTestOrder({ totalPrice: 0 })
    const message = generateTelegramMessage(order)

    expect(message).toContain('0 ₽')
  })

  it('должна работать с undefined accessories', () => {
    const order = createTestOrder({ accessories: undefined })
    const message = generateTelegramMessage(order)
    
    expect(message).toContain('🛠 <b>Опции:</b>\nНет')
  })

  it('должна работать с пустым именем прицепа', () => {
    const order = createTestOrder({ trailerName: '' })
    const message = generateTelegramMessage(order)
    
    expect(message).toContain('🚛 <b>Прицеп:</b>')
  })

  it('должна обрабатывать undefined totalPrice', () => {
    const order = createTestOrder({ totalPrice: undefined })
    const message = generateTelegramMessage(order)
    
    expect(message).toContain('0 ₽')
  })

  it('должна обрабатывать другие способы доставки по умолчанию', () => {
    const order = createTestOrder({ deliveryMethod: 'other' })
    const message = generateTelegramMessage(order)
    
    // Если не delivery, то Самовывоз
    expect(message).toContain('Самовывоз')
  })
})

describe('parseChatIds', () => {
  it('должна парсить одиночный ID', () => {
    expect(parseChatIds('12345')).toEqual(['12345'])
  })

  it('должна парсить несколько ID через запятую', () => {
    expect(parseChatIds('123,456,789')).toEqual(['123', '456', '789'])
  })

  it('должна обрезать пробелы', () => {
    expect(parseChatIds(' 123 , 456 , 789 ')).toEqual(['123', '456', '789'])
  })

  it('должна фильтровать пустые значения', () => {
    expect(parseChatIds('123,,456,,')).toEqual(['123', '456'])
  })

  it('должна возвращать пустой массив для undefined', () => {
    expect(parseChatIds(undefined)).toEqual([])
  })

  it('должна возвращать пустой массив для пустой строки', () => {
    expect(parseChatIds('')).toEqual([])
  })

  it('должна возвращать пустой массив для строки из запятых', () => {
    expect(parseChatIds(',,,')).toEqual([])
  })
})

describe('validateOrderData', () => {
  it('должна принимать валидный заказ', () => {
    const order = createTestOrder()
    expect(validateOrderData(order)).toBe(true)
  })

  it('должна принимать минимальный валидный заказ', () => {
    const order = {
      orderNumber: 'ORD-001',
      customerName: 'Тест',
      customerEmail: '', // может быть пустым
      customerPhone: '+7 999 111 22 33',
      customerCity: 'Москва',
    }
    expect(validateOrderData(order)).toBe(true)
  })

  it('должна отклонять null', () => {
    expect(validateOrderData(null)).toBe(false)
  })

  it('должна отклонять undefined', () => {
    expect(validateOrderData(undefined)).toBe(false)
  })

  it('должна отклонять примитивы', () => {
    expect(validateOrderData('string')).toBe(false)
    expect(validateOrderData(123)).toBe(false)
    expect(validateOrderData(true)).toBe(false)
  })

  it('должна отклонять пустой объект', () => {
    expect(validateOrderData({})).toBe(false)
  })

  it('должна отклонять заказ без orderNumber', () => {
    const order = createTestOrder()
    delete (order as any).orderNumber
    expect(validateOrderData(order)).toBe(false)
  })

  it('должна отклонять заказ без customerName', () => {
    const order = createTestOrder()
    delete (order as any).customerName
    expect(validateOrderData(order)).toBe(false)
  })

  it('должна отклонять заказ без customerPhone', () => {
    const order = createTestOrder()
    delete (order as any).customerPhone
    expect(validateOrderData(order)).toBe(false)
  })

  it('должна отклонять заказ без customerCity', () => {
    const order = createTestOrder()
    delete (order as any).customerCity
    expect(validateOrderData(order)).toBe(false)
  })

  it('должна отклонять заказ с неверным типом полей', () => {
    expect(validateOrderData({ orderNumber: 123, customerName: 'Test', customerPhone: '123', customerCity: 'City' })).toBe(false)
    expect(validateOrderData({ orderNumber: 'ORD', customerName: 123, customerPhone: '123', customerCity: 'City' })).toBe(false)
  })
})

describe('sendEmail', () => {
  const mockFetch = vi.fn()
  const deps = {
    apiKey: 'test-api-key',
    fromEmail: 'test@example.com',
    fetch: mockFetch as unknown as typeof globalThis.fetch,
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('должна отправлять email с корректными параметрами', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'email-123' }),
    })

    const result = await sendEmail(
      { to: 'user@example.com', subject: 'Test Subject', html: '<p>Test</p>' },
      deps
    )

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test</p>',
      }),
    })
  })

  it('должна возвращать ошибку при неудачном запросе', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Rate limit exceeded',
    })

    const result = await sendEmail(
      { to: 'user@example.com', subject: 'Test', html: '' },
      deps
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to send email')
    expect(result.error).toContain('Rate limit exceeded')
  })
})

describe('sendTelegramMessage', () => {
  const mockFetch = vi.fn()
  const deps = {
    fetch: mockFetch as unknown as typeof globalThis.fetch,
  }

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('должна отправлять сообщение с корректными параметрами', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, result: { message_id: 123 } }),
    })

    const result = await sendTelegramMessage(
      'bot-token',
      '12345',
      'Test message',
      deps
    )

    expect(result.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.telegram.org/botbot-token/sendMessage',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: '12345',
          text: 'Test message',
          parse_mode: 'HTML',
        }),
      }
    )
  })

  it('должна возвращать ошибку при неудачном запросе', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'Unauthorized',
    })

    const result = await sendTelegramMessage(
      'invalid-token',
      '12345',
      'Test',
      deps
    )

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to send Telegram message')
    expect(result.error).toContain('12345')
    expect(result.error).toContain('Unauthorized')
  })
})
