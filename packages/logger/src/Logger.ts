import './loadFormatters'
import { parse, stringify } from 'flatted'
import { Client, QueryResponse, Plugin, PluginMethod } from '@o/gqless'

const format = (...parts: any[][]) => {
  const texts: string[] = []
  const styles: string[] = []
  for (const [text, style] of parts.filter(Boolean)) {
    texts.push(text)
    styles.push(`font-weight: normal; ${style}`)
  }

  return [`%c${texts.join('%c')}`, ...styles]
}

export class Logger implements Plugin {
  constructor(protected client: Client, private verbose = false) {
    this.client.plugins.add(this)
  }

  public onCommit = (({ stacks, stackQueries, queries, accessors }) => {
    if (!this.verbose) return

    console.groupCollapsed(
      ...format(
        ['GraphQL ', 'color: gray'],
        ['fetching ', 'color: darkgrey'],
        [queries.size, 'color: hsl(252, 100%, 75%)'],
        [` quer${queries.size === 1 ? 'y' : 'ies'}`, 'color: darkgrey']
      )
    )

    const obj = {} as any

    accessors.forEach((accessor, idx) => {
      obj[accessor.path.toString()] = {
        Stack: `[${stacks[idx].join(', ')}]`,
        'Chosen query': stackQueries[idx].toString(),
      }
    })

    console.table(obj)

    console.groupEnd()
  }) as PluginMethod<'onCommit'>

  public onFetch = (async (
    accessors,
    responsePromise,
    variables,
    query,
    queryName
  ) => {
    const start = Date.now()

    let response: QueryResponse | undefined = undefined
    let error: any = undefined
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

    const headerStyles = `font-weight: bold; color: #f316c1`

    // Query
    console.group(
      ...format(
        ['Query ', headerStyles],
        ['  ', `background-image: url(https://graphql.org/img/logo.svg)`]
      )
    )
    if (variables)
      console.log(...format(['Variables', 'color: #25e1e1']), variables)

    console.log(...format([query, 'color: gray']))
    console.groupEnd()

    // Result
    if (error) {
      console.error(error)
    } else {
      console.log(...format(['Result', headerStyles]), response)
    }

    // Accessors
    console.groupCollapsed(...format(['Accessors', headerStyles]))
    for (const accessor of accessors) {
      console.log(accessor)
    }
    console.groupEnd()

    // Cache
    console.log(
      ...format(['Cache snapshot', headerStyles]),
      parse(stringify(this.client.cache))
    )

    console.groupEnd()
  }) as PluginMethod<'onFetch'>
}
