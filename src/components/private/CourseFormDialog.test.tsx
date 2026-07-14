// src/components/private/CourseFormDialog.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CourseFormDialog from './CourseFormDialog'

vi.mock('@/api/courses.api', () => ({
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
}))

import { createCourse } from '@/api/courses.api'

const onOpenChange = vi.fn()
const onSaved = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nombre'), 'React desde cero')
  await user.type(screen.getByLabelText('Descripción'), 'Curso introductorio de React')
  await user.type(screen.getByLabelText('Categoría'), 'Frontend')
  await user.type(screen.getByLabelText('Nivel'), 'Básico')
  await user.type(screen.getByLabelText('Fecha de inicio'), '2026-08-01')
  await user.type(screen.getByLabelText('Fecha de fin'), '2026-09-01')
  
  // Solución segura para inputs valueAsNumber en JSDOM: Inyectamos el valor directamente
  fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '49.90' } })
  fireEvent.change(screen.getByLabelText('Calificación promedio'), { target: { value: '4.5' } })
  
  await user.type(screen.getByLabelText('Estado'), 'activo')
  await user.type(screen.getByLabelText('Instructor'), 'Ana Higuera')
  await user.type(screen.getByLabelText('Email del instructor'), 'ana@blogapp.dev')
}

describe('CourseFormDialog — creación', () => {
  it('should call createCourse with the nested instructor payload', async () => {
    const user = userEvent.setup()
    vi.mocked(createCourse).mockResolvedValue({} as never)

    render(<CourseFormDialog open onOpenChange={onOpenChange} course={null} onSaved={onSaved} />)
    await fillRequiredFields(user)
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(createCourse).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'React desde cero',
          precio: 49.9,
          calificacion_promedio: 4.5,
          instructor: { nombre: 'Ana Higuera', email: 'ana@blogapp.dev' },
          requisitos: [],
        }),
      ),
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('should show a validation error for an invalid instructor email', async () => {
    const user = userEvent.setup()
    render(<CourseFormDialog open onOpenChange={onOpenChange} course={null} onSaved={onSaved} />)

    await screen.findByLabelText('Nombre') // Esperar que cargue
    await fillRequiredFields(user)
    
    const emailInput = screen.getByLabelText('Email del instructor')
    await user.clear(emailInput)
    await user.type(emailInput, 'no-es-un-email')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      const input = screen.getByLabelText('Email del instructor')
      expect(input).toBeInvalid() 
    })
    
    expect(createCourse).not.toHaveBeenCalled()
  })

  it('should split the comma-separated requisitos into an array', async () => {
    const user = userEvent.setup()
    vi.mocked(createCourse).mockResolvedValue({} as never)

    render(<CourseFormDialog open onOpenChange={onOpenChange} course={null} onSaved={onSaved} />)
    await fillRequiredFields(user)
    await user.type(screen.getByLabelText('Requisitos (separados por coma)'), 'JavaScript, TypeScript básico')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() =>
      expect(createCourse).toHaveBeenCalledWith(
        expect.objectContaining({ requisitos: ['JavaScript', 'TypeScript básico'] }),
      ),
    )
  })
})