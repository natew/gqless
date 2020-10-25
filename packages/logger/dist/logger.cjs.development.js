'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

var gqless = require('gqless')
var toStyle = require('to-style')
var flatted = require('flatted')

// @ts-ignore
const JSX_ELEMENT =
  /*#__PURE__*/
  Symbol('JSX_ELEMENT')
function createElement(element, props, ...children) {
  if (typeof element === 'function') {
    children[JSX_ELEMENT] = true
    return element({ ...props, children })
  }

  if (props && props.style) {
    props.style = toStyle.string(props.style)
  }

  if (Array.isArray(children) && children[0] && children[0][JSX_ELEMENT]) {
    ;[children] = children
  }

  return [
    element,
    props,
    ...children
      .map(child =>
        Array.isArray(child) && !child.find(e => !Array.isArray(e))
          ? child
          : [child]
      )
      .flat()
      .filter(Boolean),
  ]
}

function Path({ path, isRoot, isFragment, objectDepth }) {
  return createElement(
    'span',
    null,
    path.map((element, i) => {
      const fragment = isFragment && isFragment(element)
      const root = isRoot && isRoot(element)
      return createElement(
        'span',
        null,
        fragment &&
          (objectDepth
            ? createElement('span', null, '...')
            : createElement(
                'span',
                {
                  style: {
                    color: 'rgb(154, 127, 213)',
                  },
                },
                'fragment',
                path.length === 1 ? ' ' : '['
              )),
        createElement(
          'span',
          {
            style: {
              color: fragment
                ? '#5db0d7'
                : objectDepth
                ? '#E36EEC'
                : root
                ? '#03A9F4'
                : '#D2C057',
              fontWeight: root && !objectDepth ? 'bold' : 'normal',
            },
          },
          element.toString()
        ),
        fragment &&
          createElement(
            'span',
            {
              style: {
                color: 'rgb(154, 127, 213)',
              },
            },
            createElement(
              'span',
              null,
              ' ',
              'on',
              ' ',
              createElement(
                'span',
                {
                  style: {
                    color: '#E36EEC',
                  },
                },
                String(element.node)
              )
            ),
            path.length !== 1 &&
              !objectDepth &&
              createElement('span', null, ']')
          ),
        i !== path.length - 1 &&
          createElement(
            'span',
            {
              style: {
                opacity: 0.8,
              },
            },
            '.'
          )
      )
    })
  )
}

const Tree = ({ children }) =>
  createElement(
    'ol',
    {
      style: {
        listStyleType: 'none',
        padding: 0,
        margin: '0 0 0 12px',
        fontStyle: 'normal',
      },
    },
    children
  )

const TreeItem = ({ root, object, objectDepth }) =>
  createElement(
    'li',
    {
      style: {
        marginLeft: !root ? '14px' : 0,
      },
    },
    createElement('object', {
      object: object,
      config: {
        objectDepth,
      },
    })
  )

function Preview({ elements, colon, objectDepth, isFragment }) {
  return createElement(
    'span',
    {
      style: {
        fontStyle: objectDepth ? 'normal' : 'italic',
      },
    },
    colon && objectDepth && `:`,
    ` {`,
    elements.map((element, i) =>
      createElement(
        'span',
        null,
        createElement(
          'span',
          {
            style: {
              opacity: 0.7,
            },
          },
          isFragment && isFragment(element)
            ? createElement('span', null, '...')
            : null,
          element.toString().replace(/\(.+$/, `(…)`)
        ),
        i !== elements.length - 1 && createElement('span', null, ', ')
      )
    ),
    `}`
  )
}

const selectionFormatter = {
  header(selection, config = {}) {
    try {
      if (!(selection instanceof gqless.Selection)) return null
      const { selections } = selection
      return createElement(
        'div',
        null,
        createElement(Path, {
          path: [selection],
          objectDepth: config.objectDepth,
          isRoot: selection => selection.constructor === gqless.Selection,
          isFragment: selection => selection instanceof gqless.Fragment,
        }),
        selections.size &&
          createElement(Preview, {
            elements: Array.from(selections),
            objectDepth: config.objectDepth,
            isFragment: s => s instanceof gqless.Fragment,
          })
      )
    } catch {
      return null
    }
  },

  body(selection, config = {}) {
    const selections = Array.from(selection.selections)
    selections.sort(
      (a, b) =>
        +(b instanceof gqless.Fragment) - +(a instanceof gqless.Fragment)
    )
    return createElement(
      Tree,
      null,
      selections.map(selection =>
        createElement(TreeItem, {
          object: selection,
          root: !!selection.selections.size,
          objectDepth: (config.objectDepth || 0) + 1,
        })
      )
    )
  },

  hasBody(selection) {
    return !!selection.selections.size
  },
}

const accessorFormatter = {
  header(accessor, config = {}) {
    try {
      if (!(accessor instanceof gqless.Accessor)) return null
      const path = config.objectDepth
        ? accessor.path.slice(config.objectDepth)
        : accessor.path
      const { children } = accessor
      return createElement(
        'div',
        null,
        createElement(Path, {
          path: path,
          objectDepth: config.objectDepth,
          isRoot: accessor => accessor instanceof gqless.RootAccessor,
          isFragment: accessor => accessor instanceof gqless.FragmentAccessor,
        }),
        children.length
          ? createElement(Preview, {
              elements: children,
              objectDepth: config.objectDepth,
              colon: !(accessor instanceof gqless.FragmentAccessor),
              isFragment: accessor =>
                accessor instanceof gqless.FragmentAccessor,
            })
          : (config.objectDepth ||
              accessor.node instanceof gqless.ScalarNode) &&
              createElement(
                'span',
                null,
                `: `,
                createElement('object', {
                  // @ts-ignore
                  object: accessor.value ? accessor.value.toJSON() : null,
                })
              )
      )
    } catch {
      return null
    }
  },

  body(accessor) {
    const children = [...accessor.children]
    children.sort(
      (a, b) =>
        +(b instanceof gqless.FragmentAccessor) -
        +(a instanceof gqless.FragmentAccessor)
    )
    return createElement(
      Tree,
      null,
      children.map(accessor =>
        createElement(TreeItem, {
          object: accessor,
          root: !!accessor.children.length,
          objectDepth: accessor.path.length - 1,
        })
      )
    )
  },

  hasBody(accessor) {
    return !!accessor.children.length
  },
}

const proxyFormatter = {
  header(proxy) {
    try {
      if (!proxy || !proxy[gqless.ACCESSOR]) return null // @ts-ignore

      return createElement('object', {
        object: proxy[gqless.ACCESSOR],
      })
    } catch {
      return null
    }
  },

  hasBody() {
    return false
  },
}

var formatters = {
  __proto__: null,
  selectionFormatter: selectionFormatter,
  accessorFormatter: accessorFormatter,
  proxyFormatter: proxyFormatter,
}

if (typeof window !== 'undefined') {
  if (!window.devtoolsFormatters) window.devtoolsFormatters = []
  window.devtoolsFormatters.push(
    ...Object.values(formatters).filter(f => typeof f === 'object')
  )
}

const format = (...parts) => {
  const texts = []
  const styles = []

  for (const [text, style] of parts.filter(Boolean)) {
    texts.push(text)
    styles.push(`font-weight: normal; ${style}`)
  }

  return [`%c${texts.join('%c')}`, ...styles]
}

class Logger {
  constructor(client, verbose = false) {
    this.client = client
    this.verbose = verbose

    this.onCommit = ({ stacks, stackQueries, queries, accessors }) => {
      if (!this.verbose) return
      console.groupCollapsed(
        ...format(
          ['GraphQL ', 'color: gray'],
          ['fetching ', 'color: darkgrey'],
          [queries.size, 'color: hsl(252, 100%, 75%)'],
          [` quer${queries.size === 1 ? 'y' : 'ies'}`, 'color: darkgrey']
        )
      )
      const obj = {}
      accessors.forEach((accessor, idx) => {
        obj[accessor.path.toString()] = {
          Stack: `[${stacks[idx].join(', ')}]`,
          'Chosen query': stackQueries[idx].toString(),
        }
      })
      console.table(obj)
      console.groupEnd()
    }

    this.onFetch = async (
      accessors,
      responsePromise,
      variables,
      query,
      queryName
    ) => {
      const start = Date.now()
      let response = undefined
      let error = undefined

      try {
        response = await responsePromise
      } catch (e) {
        error = e
      }

      const time = Date.now() - start
      console.groupCollapsed(
        ...format(
          ['GraphQL ', 'color: gray'],
          ['query ', `color: ${error ? 'red' : '#03A9F4'}; font-weight: bold`],
          [
            `${queryName ? queryName : '(unnamed)'} `,
            'font-weight: bold; color: inherit',
          ],
          [`(${time}ms)`, 'color: gray'],
          [` ${accessors.length} accessors`, 'color: gray'],
          error && [
            'FAILED',
            'margin-left: 10px; border-radius: 2px; padding: 2px 6px; background: #e84343; color: white',
          ]
        )
      )
      const headerStyles = `font-weight: bold; color: #f316c1` // Query

      console.group(
        ...format(
          ['Query ', headerStyles],
          ['  ', `background-image: url(https://graphql.org/img/logo.svg)`]
        )
      )
      if (variables)
        console.log(...format(['Variables', 'color: #25e1e1']), variables)
      console.log(...format([query, 'color: gray']))
      console.groupEnd() // Result

      if (error) {
        console.error(error)
      } else {
        console.log(...format(['Result', headerStyles]), response)
      } // Accessors

      console.groupCollapsed(...format(['Accessors', headerStyles]))

      for (const accessor of accessors) {
        console.log(accessor)
      }

      console.groupEnd() // Cache

      console.log(
        ...format(['Cache snapshot', headerStyles]),
        flatted.parse(flatted.stringify(this.client.cache))
      )
      console.groupEnd()
    }

    this.client.plugins.add(this)
  }
}

exports.Logger = Logger
//# sourceMappingURL=logger.cjs.development.js.map
