import { NodeTypes } from './ast'

const enum TagType {
  Start,
  End
}

export function baseParse(content: string) {
  const context = createParseContext(content)

  return createRoot(parseChildren(context, []))
}

function parseChildren(context, ancestors) {
  const nodes: any = []
  while (!isEnd(context, ancestors)) {
    let node
    const s = context.source

    if (s.startsWith('{{')) {
      // 插值
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      // 标签
      if (/[a-z]/i.test(s[1])) {
        console.log('parse element')
        node = parseElement(context, ancestors)
      }
    }
    if (!node) {
      // 文本
      node = paseText(context)
    }
    nodes.push(node)
  }

  return nodes
}

function isEnd(context, ancestors) {
  // 2.遇到阶数标签
  const s = context.source
  if (s.startsWith('</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag
      if (startWithEndTagOpen(s, tag)) {
        return true
      }
    }
  }
  // if (parentTag && s.startsWith(`</${parentTag}>`)) {
  //   return true
  // }

  // 1.source有值
  return !s
}

// 解析文本
function paseText(context: any) {
  let endIndex = context.source.length
  let endTokens = ['<', '{{']

  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i])
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)
  console.log('---content ', content)

  return {
    type: NodeTypes.TEXT,
    content
  }
}

function parseTextData(context: any, length) {
  // 1.获取当前content
  const content = context.source.slice(0, length)
  // 2.推进
  advanceBy(context, length)
  return content
}

// 解析元素
function parseElement(context: any, ancestors: any[]) {
  const element: any = parseTag(context, TagType.Start)

  ancestors.push(element)
  element.children = parseChildren(context, ancestors)
  ancestors.pop()

  if (startWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End)
  } else {
    throw new Error(`缺失结束标签: ${element.tag}`)
  }
  return element
}

function startWithEndTagOpen(source, tag) {
  return source.startsWith('</') && source.slice(2, 2 + tag.length).toLowerCase() === tag
}

// 解析标签
function parseTag(context: any, type: TagType) {
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

// 解析插值
function parseInterpolation(context: any) {
  // {{message}}
  const openDelimiter = '{{'
  const closeDelimiter = '}}'

  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)

  advanceBy(context, openDelimiter.length)

  console.log('context.source : ', context.source)

  const rawContentLength = closeIndex - openDelimiter.length

  const rawContent = parseTextData(context, rawContentLength)

  const content = rawContent.trim()

  console.log('content: ', content)

  advanceBy(context, closeDelimiter.length)
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
