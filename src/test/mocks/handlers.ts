// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'
import type { LoginPayload } from '@/types/auth.types'
import type { CreateCategoryPayload } from '@/types/category.types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

export const handlers = [
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as LoginPayload
    if (body.username === 'perez' && body.password === 'secret') {
      return HttpResponse.json({
        success: true,
        message: 'Login exitoso',
        data: { access_token: 'fake-jwt-token' },
      })
    }
    return HttpResponse.json(
      { success: false, message: 'Credenciales inválidas', data: null },
      { status: 401 },
    )
  }),

  http.get(`${BASE_URL}/posts`, () => {
    return HttpResponse.json({
      success: true,
      message: 'OK',
      data: {
        items: [
          { id: 'post-1', title: 'Primer post', content: 'Contenido', category: { id: 'cat-1', name: 'Tech' } },
        ],
        meta: { itemCount: 1, totalItems: 1, itemsPerPage: 10, totalPages: 1, currentPage: 1 },
      },
    })
  }),

  http.post(`${BASE_URL}/categories`, async ({ request }) => {
    const body = (await request.json()) as CreateCategoryPayload
    return HttpResponse.json(
      { success: true, message: 'Categoría creada', data: { id: 'cat-new', name: body.name } },
      { status: 201 },
    )
  }),
]