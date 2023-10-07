import { NodeTypes } from './ast'

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParseContext(content)

  return createRoot(parseChildren(context))
}

function parseChildren(context) {
  const nodes: any = []
  let node
  const s = context.source

  console.log(s.startsWith('{{'))

  if (s.startsWith('{{')) {
    node = parseInterpolation(context)
  } else if (s[0] === '<') {
    if (/[a-z]/i.test(s[1])) {
      console.log('parse element')
      node = parseElement(context)
    }
  }
  nodes.push(node)
  return nodes
}

function parseElement(context) {
  const element = parseTag(context, TagType.Start)
  console.log('---------1', context.source)
  parseTag(context, TagType.End)
  console.log('---------2', context.source)

  return element
}

function parseTag(context, type: TagType) {
  // 1.解析tag
  const match: any = /^<\/?([a-z]*)/i.exec(context.source)
  console.log('match: ', match)
  const tag = match[1]
  // 2.删除处理完成的代码
  advanceBy(context, match[0].length + 1)
  if (type === TagType.End) return
  return {
    type: NodeTypes.ELEMENT,
    tag
    // children: [
    //   {
    //     type: NodeTypes.TEXT,
    //     content: 'hello'
    //   }
    // ]
  }
}

function parseInterpolation(context) {
  // {{message}}
  const openDelimiter = '{{'
  const closeDelimiter = '}}'

  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)

  advanceBy(context, openDelimiter.length)
  console.log('context.source : ', context.source)

  const rawContentLength = closeIndex - openDelimiter.length

  const rawContent = context.source.slice(0, rawContentLength)
  const content = rawContent.trim()
  console.log('content: ', content)

  advanceBy(context, rawContentLength + closeDelimiter.length)
  console.log('context.source : ', context.source)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content
    }
  }
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length)
}

function createRoot(children) {
  return { children }
}

function createParseContext(content: string): any {
  return { source: content }
}
