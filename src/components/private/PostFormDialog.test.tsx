// src/components/private/PostFormDialog.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PostFormDialog from './PostFormDialog'
import { createPost, updatePost } from '@/api/posts.api'
import { getCategories } from '@/api/categories.api'

vi.mock('@/api/posts.api', () => ({
  createPost: vi.fn(),
  updatePost: vi.fn(),
}))

vi.mock('@/api/categories.api', () => ({
  getCategories: vi.fn(),
}))

// Mock de infraestructura global para componentes Radix UI en JSDOM
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

// Un UUID válido real para que pase la validación z.string().uuid() de Zod
const VALID_CATEGORY_UUID = '123e4567-e89b-12d3-a456-426614174000'
const onOpenChange = vi.fn()
const onSaved = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getCategories).mockResolvedValue({
    items: [{ id: VALID_CATEGORY_UUID, name: 'Tech' }],
    meta: { itemCount: 1, totalItems: 1, itemsPerPage: 100, totalPages: 1, currentPage: 1 },
  })
})

describe('PostFormDialog — creación', () => {
  it('should call createPost with the typed fields and the selected category', async () => {
    const user = userEvent.setup()
    vi.mocked(createPost).mockResolvedValue({
      id: 'post-1',
      title: 'Nuevo post',
      content: 'Contenido largo de prueba superior a diez caracteres',
      category: { id: VALID_CATEGORY_UUID, name: 'Tech' },
    })

    render(<PostFormDialog open onOpenChange={onOpenChange} post={null} onSaved={onSaved} />)

    await user.type(screen.getByLabelText('Título'), 'Nuevo post')
    await user.type(screen.getByLabelText('Contenido'), 'Contenido largo de prueba superior a diez caracteres') // Pasa min(10)

    // Abrir el select interactuando de forma segura con Radix
    const selectTrigger = screen.getByRole('combobox')
    await user.click(selectTrigger)
    
    // Seleccionar la opción renderizada en el portal asíncrono
    const option = await screen.findByRole('option', { name: 'Tech' })
    await user.click(option)

    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(createPost).toHaveBeenCalledWith({
        title: 'Nuevo post',
        content: 'Contenido largo de prueba superior a diez caracteres',
        categoryId: VALID_CATEGORY_UUID,
      }),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(onSaved).toHaveBeenCalled()
  })

  it('should show a validation error when no category is selected', async () => {
    const user = userEvent.setup()
    render(<PostFormDialog open onOpenChange={onOpenChange} post={null} onSaved={onSaved} />)

    await user.type(screen.getByLabelText('Título'), 'Nuevo post')
    await user.type(screen.getByLabelText('Contenido'), 'Contenido largo de prueba superior a diez caracteres')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    // Solución al duplicado: Validamos mediante findAllByText evaluando que aparezca más de una vez (placeholder + p de error)
    await waitFor(async () => {
      const elements = await screen.findAllByText('Selecciona una categoría')
      expect(elements.length).toBeGreaterThan(1)
    })
    expect(createPost).not.toHaveBeenCalled()
  })
})

describe('PostFormDialog — edición', () => {
  const post = {
    id: 'post-1',
    title: 'Post existente',
    content: 'Contenido viejo largo de prueba',
    category: { id: VALID_CATEGORY_UUID, name: 'Tech' },
  }

  it('should prefill title and content when editing', async () => {
    render(<PostFormDialog open onOpenChange={onOpenChange} post={post} onSaved={onSaved} />)

    expect(screen.getByLabelText('Título')).toHaveValue('Post existente')
    expect(screen.getByLabelText('Contenido')).toHaveValue('Contenido viejo largo de prueba')
  })

  it('should call updatePost with the post id, keeping the existing category', async () => {
    const user = userEvent.setup()
    vi.mocked(updatePost).mockResolvedValue({ ...post, title: 'Post editado' })

    render(<PostFormDialog open onOpenChange={onOpenChange} post={post} onSaved={onSaved} />)

    const titleInput = await screen.findByLabelText('Título')
    await user.clear(titleInput)
    await user.type(titleInput, 'Post editado')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(updatePost).toHaveBeenCalledWith('post-1', {
        title: 'Post editado',
        content: 'Contenido viejo largo de prueba',
        categoryId: VALID_CATEGORY_UUID,
      }),
    )
    expect(createPost).not.toHaveBeenCalled()
  })
})