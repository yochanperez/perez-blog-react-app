// src/api/categories.api.test.ts
import { http, HttpResponse } from 'msw'
import { server } from '@/test/mocks/server'
import { createCategory } from './categories.api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

describe('createCategory()', () => {
  it('should return the created category', async () => {
    const category = await createCategory({ name: 'Frontend' })
    expect(category).toMatchObject({ id: 'cat-new', name: 'Frontend' })
  })

  it('should send the payload as the request body', async () => {
    let receivedBody: unknown
    server.use(
      http.post(`${BASE_URL}/categories`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json({ success: true, message: 'OK', data: { id: 'cat-new', name: 'Frontend' } })
      }),
    )

    await createCategory({ name: 'Frontend' })
    expect(receivedBody).toEqual({ name: 'Frontend' })
  })
})