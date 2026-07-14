// src/api/posts.api.test.ts
import { getPosts } from './posts.api'

describe('getPosts()', () => {
  it('should return the paginated items from the API', async () => {
    const result = await getPosts()
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ title: 'Primer post', category: { name: 'Tech' } })
  })

  it('should expose pagination meta', async () => {
    const result = await getPosts()
    expect(result.meta).toMatchObject({ totalItems: 1, totalPages: 1, currentPage: 1 })
  })
})