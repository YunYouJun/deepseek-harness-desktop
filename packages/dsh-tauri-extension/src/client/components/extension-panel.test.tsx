// @vitest-environment jsdom
import type { MarketFace } from '../service/market.types'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExtensionPanel } from './extension-panel'

vi.mock('dsh-tauri-ui/client', () => ({ SegmentedControl: () => null }))
vi.mock('../locales', () => ({ locale: { text: (key: string) => key } }))
vi.mock('./skills-tab', () => ({
  SkillsTab: () => (
    <section>
      skills-content
      <input aria-label="skill draft" defaultValue="" />
    </section>
  ),
}))
vi.mock('./mcp-tab', () => ({ McpTab: () => <section>mcp-content</section> }))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('extension panel market composition', () => {
  it('renders the market element with the installed subsection preference', () => {
    const render = vi.fn(() => <section>installed-market-content</section>)
    const market: MarketFace = { version: 1, render, setSettingsVisible: vi.fn(), settingsVisible: () => false }
    const markup = renderToStaticMarkup(<ExtensionPanel market={market} createSkill={async () => {}} />)
    expect(render).toHaveBeenCalledExactlyOnceWith({ preferredSubsectionId: 'installed' })
    expect(markup).toContain('installed-market-content')
    expect(markup).not.toContain('skills-content')
    expect(markup).not.toContain('mcp-content')
  })

  it('renders skills when the optional market service is missing', () => {
    const markup = renderToStaticMarkup(<ExtensionPanel market={undefined} createSkill={async () => {}} />)
    expect(markup).toContain('skills-content')
    expect(markup).not.toContain('installed-market-content')
    expect(markup).not.toContain('mcp-content')
  })

  it('keeps a fallback tab mounted when the market disappears and returns', () => {
    const market: MarketFace = { version: 1, render: () => <section>market</section>, setSettingsVisible: vi.fn(), settingsVisible: () => false }
    const createSkill = async () => {}
    const view = render(<ExtensionPanel market={market} createSkill={createSkill} />)
    view.rerender(<ExtensionPanel market={undefined} createSkill={createSkill} />)
    const draft = view.getByRole('textbox', { name: 'skill draft' })
    fireEvent.change(draft, { target: { value: 'unsaved skill' } })
    view.rerender(<ExtensionPanel market={market} createSkill={createSkill} />)
    expect(draft.isConnected).toBe(true)
    expect(draft.closest('[role="tabpanel"]')?.hasAttribute('hidden')).toBe(true)
    view.rerender(<ExtensionPanel market={undefined} createSkill={createSkill} />)
    expect(view.getByRole('textbox', { name: 'skill draft' })).toBe(draft)
    expect((draft as HTMLInputElement).value).toBe('unsaved skill')
  })
})
