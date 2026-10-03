// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { MarkdownPreview } from './markdown'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

it('preserves headings, links, fenced code, tables and task lists', () => {
  const errors = vi.spyOn(console, 'error')
  const { container, getByRole } = render(<MarkdownPreview text={'# Skills\n\n[docs](https://example.com "Documentation")\n\n```ts\nconst x = "<safe>"\n```\n\n| Name | Value |\n| --- | --- |\n| test | 1 |\n\n- [x] Ready\n- [ ] Waiting'} />)
  expect(getByRole('heading', { name: 'Skills' })).toBeTruthy()
  expect(getByRole('link', { name: 'docs' }).getAttribute('href')).toBe('https://example.com')
  expect(container.querySelector('pre code')?.textContent).toBe('const x = "<safe>"\n')
  expect(container.querySelector('code')?.className).toBe('language-ts')
  expect(container.querySelector('td')?.textContent).toBe('test')
  const boxes = getByRole('list').querySelectorAll('input')
  expect([...boxes].map(box => [box.checked, box.disabled])).toEqual([[true, true], [false, true]])
  expect(errors).not.toHaveBeenCalled()
})

it('removes executable HTML and unsafe links before creating React elements', () => {
  const { container } = render(<MarkdownPreview text={'<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)"><a href="javascript:alert(1)">unsafe</a><svg onload="alert(1)"></svg>'} />)
  expect(container.querySelector('script, svg')).toBeNull()
  expect(container.querySelector('img')?.hasAttribute('onerror')).toBe(false)
  expect(container.querySelector('a')?.hasAttribute('href')).toBe(false)
  expect(container.textContent?.trim()).toBe('unsafe')
})

it('updates repeated content and retains sanitized raw HTML attributes', () => {
  const { container, rerender } = render(<MarkdownPreview text={'<p class="intro" style="text-align: center">First</p>\n\nSame\n\nSame'} />)
  expect(container.querySelector('.intro')?.getAttribute('style')).toBe('text-align: center;')
  expect(container.querySelectorAll('p')).toHaveLength(3)
  rerender(<MarkdownPreview text="**Updated**" />)
  expect(container.querySelector('strong')?.textContent).toBe('Updated')
  expect(container.textContent?.trim()).toBe('Updated')
})
