// src/pages/private/PostsPage.test.tsx
import { http, HttpResponse } from 'msw'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { server } from '@/test/mocks/server'
import PostsPage from './PostsPage'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
// Usamos un UUID real válido (caracteres hex entre a-f y números) para saltar la regla .uuid() de Zod
const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'
const CATEGORY = { id: VALID_UUID, name: 'Tech' }

beforeAll(() => {
  if (!window.PointerEvent) {
    class MockPointerEvent extends Event {
      button = 0; ctrlKey = false;
      constructor(type: string, props: any = {}) {
        super(type, props);
        this.button = props.button || 0;
        this.ctrlKey = props.ctrlKey || false;
      }
    }
    window.PointerEvent = MockPointerEvent as any;
  }
  HTMLElement.prototype.scrollIntoView = vi.fn();
})

it('should list, create, edit and delete a post end to end', async () => {
  // Base de datos mutable dinámica para los re-fetches de MSW
  let postsDatabase = [{ id: 'post-1', title: 'Primer post', content: 'Contenido largo de prueba', category: CATEGORY }]

  server.use(
    http.get(`${BASE_URL}/categories`, () =>
      HttpResponse.json({
        success: true,
        message: 'OK',
        data: { items: [CATEGORY], meta: { itemCount: 1, totalItems: 1, itemsPerPage: 100, totalPages: 1, currentPage: 1 } },
      }),
    ),
    // Retorno dinámico funcional para que capte las mutaciones del array
    http.get(`${BASE_URL}/posts`, () => {
      return HttpResponse.json({
        success: true,
        message: 'OK',
        data: { 
          items: postsDatabase, 
          meta: { itemCount: postsDatabase.length, totalItems: postsDatabase.length, itemsPerPage: 50, totalPages: 1, currentPage: 1 } 
        },
      })
    }),
    http.post(`${BASE_URL}/posts`, async ({ request }) => {
      const body = (await request.json()) as { title: string; content: string; categoryId: string }
      const created = { id: 'post-2', title: body.title, content: body.content, category: CATEGORY }
      postsDatabase = [...postsDatabase, created]
      return HttpResponse.json({ success: true, message: 'OK', data: created }, { status: 201 })
    }),
    http.put(`${BASE_URL}/posts/:id`, async ({ params, request }) => {
      const body = (await request.json()) as { title: string; content: string; categoryId: string }
      postsDatabase = postsDatabase.map((p) => (p.id === params.id ? { ...p, title: body.title, content: body.content } : p))
      return HttpResponse.json({ success: true, message: 'OK', data: { id: params.id, ...body, category: CATEGORY } })
    }),
    http.delete(`${BASE_URL}/posts/:id`, ({ params }) => {
      postsDatabase = postsDatabase.filter((p) => p.id !== params.id)
      return new HttpResponse(null, { status: 204 })
    }),
  )

  const user = userEvent.setup()
  
  render(
    <MemoryRouter>
      <PostsPage />
    </MemoryRouter>
  )

  // 1. Listado inicial
  expect(await screen.findByRole('link', { name: 'Primer post' })).toBeInTheDocument()

  // 2. Crear
  await user.click(screen.getByRole('button', { name: /nuevo post/i }))
  await user.type(screen.getByLabelText('Título'), 'Post nuevo')
  await user.type(screen.getByLabelText('Contenido'), 'Contenido del post nuevo bastante largo de prueba') // Pasa min(10)
  
  // Abrir y seleccionar la opción en el portal accesible de Radix
  await user.click(screen.getByRole('combobox'))
  const option = await screen.findByRole('option', { name: 'Tech' })
  await user.click(option)
  
  await user.click(screen.getByRole('button', { name: /guardar/i }))

  // Con el UUID correcto el formulario enviará los datos y la fila aparecerá asíncronamente
  let newPostLink: HTMLElement | null = null
  await waitFor(() => {
    newPostLink = screen.getByRole('link', { name: 'Post nuevo' })
    expect(newPostLink).toBeInTheDocument()
  })

  // 3. Editar
  const row = newPostLink!.closest('tr')!
  await user.click(within(row).getByRole('button', { name: /editar/i }))
  
  const titleInput = await screen.findByLabelText('Título')
  await user.clear(titleInput)
  await user.type(titleInput, 'Post editado')
  await user.click(screen.getByRole('button', { name: /guardar/i }))
  
  await waitFor(() => {
    expect(screen.getByRole('link', { name: 'Post editado' })).toBeInTheDocument()
  })

  // 4. Borrar
  const editedRow = screen.getByRole('link', { name: 'Post editado' }).closest('tr')!
  await user.click(within(editedRow).getByRole('button', { name: /borrar/i }))
  
  await waitFor(() => {
    expect(screen.queryByRole('link', { name: 'Post editado' })).not.toBeInTheDocument()
  })
})