const upperCaseName = /^[A-Z][A-Z0-9_]*$/
const sourceComment = /^ Source :/
const loopStatements = new Set(['ForStatement', 'ForInStatement', 'ForOfStatement'])

function getContiguousCommentsAbove(sourceCode, anchor) {
  const comments = sourceCode.getCommentsBefore(anchor)
  const isLinkedToNext = (comment, index) => {
    const nextStartLine = comments[index + 1]?.loc.start.line ?? anchor.loc.start.line
    return comment.loc.end.line === nextStartLine - 1
  }
  const lastBrokenIndex = comments.findLastIndex((comment, index) => !isLinkedToNext(comment, index))
  return comments.slice(lastBrokenIndex + 1)
}

function hasSourceComment(sourceCode, anchor) {
  return getContiguousCommentsAbove(sourceCode, anchor).some(
    (comment) => comment.type === 'Line' && sourceComment.test(comment.value),
  )
}

function getDeclarationAnchor(declaration) {
  return declaration.parent.type === 'ExportNamedDeclaration' ? declaration.parent : declaration
}

const constantHasSource = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      missingSource: 'Constant {{name}} needs a "// Source :" comment right above it.',
    },
  },
  create(context) {
    const { sourceCode } = context
    return {
      VariableDeclaration(declaration) {
        if (declaration.kind !== 'const' || loopStatements.has(declaration.parent.type)) return
        const anchor = getDeclarationAnchor(declaration)
        declaration.declarations.forEach(({ id }) => {
          const isNamedConstant = id.type === 'Identifier' && upperCaseName.test(id.name)
          if (!isNamedConstant || hasSourceComment(sourceCode, anchor)) return
          context.report({ node: id, messageId: 'missingSource', data: { name: id.name } })
        })
      },
    }
  },
}

export default constantHasSource
