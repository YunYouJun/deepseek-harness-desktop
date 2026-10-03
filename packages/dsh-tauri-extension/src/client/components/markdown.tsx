import type { ReactElement, ReactNode } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'
import { createElement } from 'react'

const ATTRIBUTE_NAMES: Readonly<Record<string, string>> = {
  class: 'className',
  for: 'htmlFor',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  tabindex: 'tabIndex',
}
const TABLE_CONTAINERS = new Set(['table', 'thead', 'tbody', 'tfoot', 'tr', 'colgroup'])

function renderNodes(parent: ParentNode): ReactNode[] {
  const occurrences = new Map<string, number>()
  return Array.from(parent.childNodes, (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (parent instanceof HTMLElement && TABLE_CONTAINERS.has(parent.localName) && !node.textContent?.trim())
        return null
      return node.textContent
    }
    if (!(node instanceof HTMLElement))
      return null
    const occurrence = occurrences.get(node.outerHTML) ?? 0
    occurrences.set(node.outerHTML, occurrence + 1)
    const attributes: Record<string, unknown> = { key: JSON.stringify([node.outerHTML, occurrence]) }
    for (const { name, value } of Array.from(node.attributes)) {
      if (name === 'style') {
        attributes.style = Object.fromEntries(Array.from(node.style, property => [
          property.startsWith('--') ? property : property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()),
          node.style.getPropertyValue(property),
        ]))
      }
      else if (name === 'checked' || name === 'disabled') {
        attributes[name === 'checked' ? 'defaultChecked' : name] = true
      }
      else {
        attributes[ATTRIBUTE_NAMES[name] ?? name] = value
      }
    }
    return createElement(node.localName, attributes, ...renderNodes(node))
  })
}

const MD_BODY = [
  '[&_h1]:mt-[14px] [&_h1]:mb-[6px] [&_h1]:text-[18px] [&_h1]:text-primary [&_h1]:leading-[1.4]',
  '[&_h2]:mt-[14px] [&_h2]:mb-[6px] [&_h2]:text-[16px] [&_h2]:text-primary [&_h2]:leading-[1.4]',
  '[&_h3]:mt-[14px] [&_h3]:mb-[6px] [&_h3]:text-[14px] [&_h3]:text-primary [&_h3]:leading-[1.4]',
  '[&_h4]:mt-[14px] [&_h4]:mb-[6px] [&_h4]:text-[13px] [&_h4]:text-primary [&_h4]:leading-[1.4]',
  '[&_p]:my-[6px] [&_p]:leading-[20px]',
  '[&_ul]:my-[6px] [&_ul]:pl-[20px] [&_ol]:my-[6px] [&_ol]:pl-[20px]',
  '[&_code]:[font-family:var(--ds-font-family-code)] [&_code]:text-[12px] [&_code]:bg-layer-3 [&_code]:rounded-[4px] [&_code]:px-[5px] [&_code]:py-[1px]',
  '[&_pre]:my-[8px] [&_pre]:px-[12px] [&_pre]:py-[10px] [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-border-l2 [&_pre]:rounded-[8px] [&_pre]:bg-layer-3',
  '[&_a]:text-business',
].join(' ')

export function MarkdownPreview(props: { text: string }): ReactElement {
  const fragment = DOMPurify.sanitize(marked.parse(props.text, { async: false, gfm: true, breaks: false }), {
    RETURN_DOM_FRAGMENT: true,
    USE_PROFILES: { html: true },
  })
  return <div className={MD_BODY}>{renderNodes(fragment)}</div>
}
