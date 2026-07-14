// src/components/ToastContainer.test.tsx
import { render, screen } from '@testing-library/react'
import { useToastStore } from '@/store/toast.store'
import ToastContainer from './ToastContainer'

beforeEach(() => {
  useToastStore.setState({ message: null })
})

describe('ToastContainer', () => {
  it('should render nothing when there is no message', () => {
    render(<ToastContainer />)
    const toastMessage = screen.queryByText(/.+/) 
    expect(toastMessage).not.toBeInTheDocument()
  })

  it('should show the message from the toast store', () => {
    useToastStore.setState({ message: 'Ocurrió un error inesperado' })
    render(<ToastContainer />)
    expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument()
  })

  it('should clear itself after 4 seconds', () => {
    vi.useFakeTimers()
    useToastStore.setState({ message: 'Ocurrió un error inesperado' })
    render(<ToastContainer />)

    vi.advanceTimersByTime(4000)

    expect(useToastStore.getState().message).toBeNull()
    vi.useRealTimers()
  })
})