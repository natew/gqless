import { Mix, Generic, getMixin } from 'mix-classes'
import { __decorate } from 'tslib'
import {
  createEvent,
  invariant,
  computed,
  createMemo,
  lazyGetters,
} from '@gqless/utils'
import stringify from 'json-stable-stringify'

let id = 0
class Value {
  constructor(node, data = node instanceof ArrayNode ? [] : {}) {
    this.node = node
    this.id = ++id
    this.references = new Map() // When a new Value is associated with a key

    this.onSet = createEvent() // When data is updated (reference equality)

    this.onChange = createEvent() // When a Value becomes referenced

    this.onReference = createEvent() // When a Value becomes de-refenerced

    this.onUnreference = createEvent()
    this.data = data
    this.onSet.listen((key, value) => {
      if (!this.references.has(value)) this.references.set(value, new Set())
      const referencedKeys = this.references.get(value)
      if (!referencedKeys.size) this.onReference.emit(value)
      referencedKeys.add(key)
      this.onSet
        .filter(k => k === key)
        .then(() => {
          referencedKeys.delete(key)
          if (referencedKeys.size) return
          this.references.delete(value)
          this.onUnreference.emit(value)
        })
    })
  }

  get data() {
    return this._data
  }

  set data(data) {
    const prevData = this._data
    if (data === prevData) return
    this._data = data

    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        key = String(key)
        if (
          (prevData === null || prevData === void 0
            ? void 0
            : prevData[key]) === value
        )
          return
        this.onSet.emit(key, value)
      })
    }

    this.onChange.emit(prevData)
  }

  get(key) {
    if (this.data && typeof this.data === 'object') {
      if (this.data.hasOwnProperty(key)) {
        return this.data[key]
      }
    }

    return undefined
  }

  set(key, value) {
    var _this$data

    key = String(key)
    const prevValue =
      (_this$data = this.data) === null || _this$data === void 0
        ? void 0
        : _this$data[key]
    if (prevValue === value) return
    this.data[key] = value
    this.onSet.emit(key, value)
  }

  toJSON(deep = true) {
    if (deep !== true) return this.data

    if (this.node instanceof ArrayNode) {
      if (!this.data) return null
      return this.data.map(value => value.toJSON())
    }

    if (this.node instanceof ObjectNode) {
      if (!this.data) return null
      const obj = {
        __typename: this.node.name,
      }
      Object.entries(this.data).forEach(([key, value]) => {
        obj[key] = value.toJSON()
      })
      return obj
    }

    return this.data
  }
}

const deepReference = rootValue => {
  const disposers = new Set()
  const onReference = createEvent()
  const onUnreference = createEvent()
  let valueReferences = new WeakMap([
    [
      rootValue,
      {
        count: 1,
      },
    ],
  ])

  const watchAndEmit = parentValue => {
    const watcherDisposers = new Set()

    const handleReference = value => {
      if (!valueReferences.has(value))
        valueReferences.set(value, {
          count: 0,
        })
      const references = valueReferences.get(value)
      const unrefFromParent = parentValue.onUnreference.filter(v => v === value) // Update reference count

      references.count++
      unrefFromParent.then(() => {
        references.count--
        if (references.count) return
        onUnreference.emit(value)
      }) // If there's another reference beside our own,
      // delegate to it

      if (references.count !== 1) return
      onReference.emit(value)
      const dispose = watchAndEmit(value) // When the root is disposed, dispose watcher

      disposers.add(dispose) // else wait until value is globally unreferenced

      onUnreference.filter(v => v === value).then(dispose)
    } // Handle references created, before watchAndEmit called

    for (const ref of parentValue.references.keys()) {
      handleReference(ref)
    }

    watcherDisposers.add(
      // When the parent value references a new value
      // recursively watch it
      parentValue.onReference.listen(handleReference)
    )
    return () => watcherDisposers.forEach(dispose => dispose())
  }

  const disposeWatcher = watchAndEmit(rootValue)
  return {
    onReference,
    onUnreference,

    dispose() {
      disposers.forEach(dispose => dispose())
      disposeWatcher()
    },
  }
}

const createValue = (node, data) =>
  new Value(
    node, // Only initialize with data if it's ScalarNode or EnumNode
    data === null
      ? null
      : node instanceof ScalarNode || node instanceof EnumNode
      ? data
      : undefined
  )

const extensionsForKey = (extensions, get, ...nodes) => {
  const keyedExtensions = []

  for (const extension of extensions) {
    const keyExtension = get(extension)
    if (!keyExtension) continue
    keyedExtensions.push(keyExtension)
  }

  for (const node of nodes) {
    const extension = node === null || node === void 0 ? void 0 : node.extension
    if (!extension) continue
    keyedExtensions.push(extension)
  }

  return keyedExtensions
}

class Selection {
  constructor(node) {
    this.node = node // Selections that should be fetched with all queries

    this.keySelections = new Set()
    this.selections = new Set()
    /**
     * Emitted when a child selection is created
     */

    this.onSelect = createEvent()
    /**
     * Emitted when a child selection is unselected
     */

    this.onUnselect = createEvent()
  }

  add(selection, isKeySelection = false) {
    !(selection !== this)
      ? process.env.NODE_ENV !== 'production'
        ? invariant(false, `Circular selections are not permitted!`)
        : invariant(false)
      : void 0
    if (isKeySelection) this.keySelections.add(selection)
    if (this.selections.has(selection)) return
    this.selections.add(selection)
    this.onSelect.emit(selection) // Forward events

    selection.onSelect.listen(this.onSelect.emit)
    selection.onUnselect.listen(this.onUnselect.emit)
  }

  get(find) {
    for (const selection of this.selections) {
      if (
        typeof find === 'function'
          ? find(selection)
          : String(selection) === String(find)
      )
        return selection
    }

    return
  }

  delete(selection) {
    if (!this.selections.has(selection)) return
    this.selections.delete(selection)
    this.keySelections.delete(selection) // Unforward events

    selection.onSelect.off(this.onSelect.emit)
    selection.onUnselect.off(this.onUnselect.emit)

    const emitUnselect = selection => {
      // Emit unselect for each selection
      this.onUnselect.emit(selection)
      selection.selections.forEach(emitUnselect)
    }

    emitUnselect(selection)
  }

  toString() {
    return String(this.node)
  }
}

class Variable {
  constructor(value, options = {}) {
    this.options = options
    Object.assign(this, options)
    this.updateValue(value)
  }

  updateValue(value) {
    if (value === this.value) return

    if (value === null) {
      !(this.nullable !== false)
        ? process.env.NODE_ENV !== 'production'
          ? invariant(
              false,
              `Can't set non-nullable variable of type ${this.node}, to null`
            )
          : invariant(false)
        : void 0
    }

    this.value = value
  }

  updateNullable(nullable) {
    if (this.nullable === true) {
      !nullable
        ? process.env.NODE_ENV !== 'production'
          ? invariant(
              false,
              `Can't convert a nullable variable of type ${this.node}, to non-nullable`
            )
          : invariant(false)
        : void 0
    }

    if (this.nullable !== false) {
      this.nullable = nullable
    }
  }

  validateNode(node, nullable) {
    if (!this.node) this.node = node
    !(this.node === node)
      ? process.env.NODE_ENV !== 'production'
        ? invariant(
            false,
            `Cannot change variable from type '${this.node}' to '${node}`
          )
        : invariant(false)
      : void 0

    if (nullable !== undefined) {
      this.updateNullable(nullable)
    }
  }

  toString() {
    return `${this.node}${this.nullable ? '' : '!'}`
  }

  toJSON() {
    return this.value
  }
}

class Disposable {
  constructor() {
    this.disposers = new Set()
    this.disposed = false
  }

  addDisposer(...disposers) {
    disposers.forEach(
      dispose => typeof dispose === 'function' && this.disposers.add(dispose)
    )
    return () => this.deleteDiposer(...disposers)
  }

  deleteDiposer(...disposers) {
    disposers.forEach(
      dispose => typeof dispose === 'function' && this.disposers.delete(dispose)
    )
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.disposers.forEach(dispose => dispose.call(this))
  }
}

const uniquify = (
  desiredName,
  isTaken,
  uniquify = (name, id) => `${name}${id}`
) => {
  const unique = (id = 2) => {
    const differentName = uniquify(desiredName, id)
    return isTaken(differentName) ? unique(id + 1) : differentName
  }

  return isTaken(desiredName) ? unique() : desiredName
}

const deepJSONEqual = (a, b, customCompare) => {
  const isEqual =
    customCompare === null || customCompare === void 0
      ? void 0
      : customCompare(a, b)
  if (isEqual !== undefined) return isEqual // Called in JSON.stringify (currently not used internally)

  if (a && typeof a.toJSON === 'function') a = a.toJSON()
  if (b && typeof b.toJSON === 'function') b = b.toJSON()
  if (a === b) return true

  if (a && b && typeof a == 'object' && typeof b == 'object') {
    if (a.constructor !== b.constructor) return false
    let length, i, key, keys

    if (Array.isArray(a)) {
      length = a.length
      if (length !== b.length) return false

      for (i = length; i-- !== 0; )
        if (!deepJSONEqual(a[i], b[i], customCompare)) return false

      return true
    }

    keys = Object.keys(a)
    length = keys.length
    if (length !== Object.keys(b).length) return false

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false

    for (i = length; i-- !== 0; ) {
      key = keys[i]
      if (!deepJSONEqual(a[key], b[key], customCompare)) return false
    }

    return true
  }

  return a !== a && b !== b
}

class PathArray extends Array {
  constructor(...items) {
    super(...items)
    Object.setPrototypeOf(this, Object.create(PathArray.prototype))
  }

  toString() {
    return this.map(element => String(element)).join('.')
  }
}

const camelCase = value =>
  value
    .map((word, i) => {
      if (i === 0) return word
      return word[0].toUpperCase() + word.substr(1)
    })
    .join('')

const arrayEqual = (a, b) => {
  if (a === b) return true
  if (a == null || b == null) return false
  if (a.length != b.length) return false
  return a.every((value, i) => b[i] === value)
}

const buildVariable = ({ options }, variable, info) => {
  let name =
    variable.name ||
    (options.prettify && (info === null || info === void 0 ? void 0 : info.path)
      ? camelCase(info.path)
      : 'v')

  if (info) {
    if (info.node) variable.validateNode(info.node, info.nullable)

    if (info.variables) {
      const existingVariable = info.variables.has(name)

      if (existingVariable) {
        name = uniquify(name, name => info.variables.has(name))
      }

      info.variables.set(name, variable)
    }
  }

  return `$${name}`
}

const buildArguments = (
  { SPACE, SEPARATOR, options, formatter },
  args,
  info
) => {
  const buildKeyed = (arg, path, context) => {
    const keys = Object.keys(arg)
    keys.sort()
    return keys
      .map(key => {
        let keyContext

        if (context) {
          const field = context.node.inputs[key]
          if (!field) return
          keyContext = {
            node: field.ofNode,
            nullable: field.nullable,
          }
        }

        const result = build(arg[key], [...path, key], keyContext)
        if (result === undefined) return
        return `${key}:${SPACE}${result}`
      })
      .filter(Boolean)
      .join(SEPARATOR)
  }

  const build = (arg, path, context) => {
    if (options.variables && arg instanceof Variable) {
      return buildVariable(formatter, arg, {
        ...info,
        ...context,
        path: [...((info && info.path) || []), ...path],
      })
    }

    if (arg && typeof arg.toJSON === 'function') arg = arg.toJSON()

    if (arg === null) {
      return 'null'
    }

    if (
      (context === null || context === void 0
        ? void 0
        : context.node) instanceof EnumNode
    ) {
      return arg
    }

    if (
      typeof arg === 'string' ||
      typeof arg === 'number' ||
      typeof arg === 'boolean'
    )
      return JSON.stringify(arg)

    if (
      (context === null || context === void 0
        ? void 0
        : context.node) instanceof ScalarNode
    ) {
      // Object / Array passed as scalar
      // serialize as a JSON-string
      return JSON.stringify(JSON.stringify(arg))
    }

    if (Array.isArray(arg)) {
      let indexContext

      if (context) {
        const arrayNode = context.node
        indexContext = {
          node: arrayNode.ofNode,
          nullable: arrayNode.nullable,
        }
      }

      return `[${arg.map(a => build(a, path, indexContext)).join(SEPARATOR)}]`
    }

    return `{${SPACE}${buildKeyed(arg, path, context)}${SPACE}}`
  }

  return buildKeyed(
    args,
    [],
    info && {
      node: info.node,
      nullable: false,
    }
  )
}

const buildSelections = ({ LINE_SEPARATOR, formatter }, tree, variables) => {
  const innerNode =
    tree.selection.node instanceof NodeContainer
      ? tree.selection.node.innerNode
      : tree.selection.node
  if (innerNode instanceof ScalarNode || innerNode instanceof EnumNode)
    return ''
  const includeTypename = // When no selections or not on ObjectNode
    (!tree.children.length || !(innerNode instanceof ObjectNode)) && // fragments should never need __typename
    !(tree.selection instanceof Fragment)
  const selections = [
    includeTypename && '__typename',
    ...tree.children.map(tree =>
      buildSelectionTree(formatter, tree, variables)
    ),
  ].filter(Boolean)
  if (!selections.length) return ''
  return selections.join(LINE_SEPARATOR)
}

const buildFieldSelectionTree = (
  { SPACE, hug, indent, formatter },
  tree,
  variables
) => {
  const buildAlias = () => {
    if (!tree.alias) return ''
    return `${tree.alias}:${SPACE}`
  }

  const buildArgs = () => {
    const args = tree.selection.args
    if (!args) return ''
    return `(${buildArguments(formatter, args, {
      variables,
      node: tree.selection.field.args,
      path: [tree.selection.field.name],
    })})`
  }

  const buildChildren = () => {
    const selections = buildSelections(formatter, tree, variables)
    if (!selections) return ''
    return `${SPACE}${hug(indent(selections))}`
  }

  return `${buildAlias()}${
    tree.selection.field.name
  }${buildArgs()}${buildChildren()}`
}

const buildFragmentTree = ({ SPACE, hug, indent, formatter }, tree) => {
  const fragmentName = tree.allFragments.get(tree.selection)

  if (formatter.options.fragments !== 'inline' && fragmentName) {
    return `...${fragmentName}`
  }

  const parentNode =
    tree.parent.selection.node instanceof NodeContainer
      ? tree.parent.selection.node.innerNode
      : tree.parent.selection.node // If it's on the same node, and inline then omit type

  if (tree.selection.node === parentNode) {
    return buildSelections(formatter, tree)
  }

  let selections = buildSelections(formatter, tree)
  if (!selections) return ''
  let huggedSelections = hug(indent(selections)) // Add comment with fragment name (for debugging)

  if (
    process.env.NODE_ENV !== 'production' &&
    formatter.options.prettify &&
    tree.selection.name
  ) {
    huggedSelections = huggedSelections.replace(
      '{',
      `{ #[${tree.selection.name}]`
    )
  }

  return `...${SPACE}on ${tree.selection.node}${SPACE}${huggedSelections}`
}

const buildSelectionTree = ({ formatter }, tree, variables) => {
  if (tree.selection instanceof FieldSelection)
    return buildFieldSelectionTree(formatter, tree, variables)
  if (tree.selection instanceof Fragment)
    return buildFragmentTree(formatter, tree)
  return buildSelections(formatter, tree, variables)
}

let id$1 = 0
const getAlias = tree => {
  if (!tree.parent) return

  for (const siblingTree of tree.parent.children) {
    if (siblingTree.selection instanceof FieldSelection) {
      if (
        tree.selection !== siblingTree.selection ||
        tree.selection.field === siblingTree.selection.field
      ) {
        id$1 = (id$1 + 1) % Number.MAX_VALUE
        return `${tree.selection.field.name}__${id$1}`
      }
    }
  }

  return '' // this was causing issues with names - we need to add id to every field
  // plus the memoization in prod mode caused a big bug
  // const fieldAliases = memoized(() => {
  //   const aliases = new Map<FieldSelection, string>()
  //   let id = 0
  //   tree.parent!.children.forEach(siblingTree => {
  //     if (!(siblingTree.selection instanceof FieldSelection)) return
  //     if (
  //       tree.selection === siblingTree.selection ||
  //       tree.selection.field !== siblingTree.selection.field
  //     )
  //       return
  //     aliases.set(tree.selection, `${tree.selection.field.name}__${++id}`)
  //   })
  //   return aliases
  // }, [tree.parent, tree.selection.field])
  // return fieldAliases.get(tree.selection)!
}

/**
 * Resolves aliases from a JSON object, back into cache-compatible
 * keys
 *
 * eg. user -> user(id: 100)
 */

function resolveAliases(data) {
  const recurse = (node, data) => {
    if (!data) return

    if (node instanceof ObjectNode) {
      let originals = new Map()
      let updated = new Set()

      const recurseObjectTree = tree =>
        tree.children.forEach(tree => {
          if (tree.selection instanceof Fragment) {
            recurseObjectTree(tree)
            return
          }

          if (!data.hasOwnProperty(tree.key)) return
          const cacheKey = tree.selection.toString()
          let value = data[tree.key]

          if (originals.has(tree.key)) {
            value = originals.get(tree.key)
            originals.delete(tree.key)
          }

          if (tree.key !== cacheKey) {
            // If the key already exists, record original value
            if (data.hasOwnProperty(cacheKey))
              originals.set(cacheKey, data[cacheKey])
            data[cacheKey] = value
            updated.add(cacheKey) // Only delete, if it hasn't been updated

            if (!updated.has(tree.key)) delete data[tree.key]
          }

          tree.resolveAliases(value)
        })

      recurseObjectTree(this)
      !!originals.size
        ? process.env.NODE_ENV !== 'production'
          ? invariant(
              false,
              `Unable to resolve aliases for keys ${Array.from(originals.keys())
                .map(k => `'${k}'`)
                .join(', ')} [at path ${this.toString()}]`
            )
          : invariant(false)
        : void 0
    }

    if (node instanceof ArrayNode) {
      data.forEach(indexData => recurse(node.ofNode, indexData))
    }
  }

  recurse(this.selection.node, data)
}

class SelectionTree {
  constructor(selection, parent) {
    this.selection = selection
    this.parent = parent
    this.duplicatedFragments = this.parent
      ? this.parent.duplicatedFragments
      : new Map()
    this.allFragments = this.parent ? this.parent.allFragments : new WeakMap()
    this.children = []
    this.resolveAliases = resolveAliases
    const fragmentTree = this.getExistingTree()
    if (fragmentTree) return fragmentTree
  }

  getExistingTree() {
    if (!(this.selection instanceof Fragment)) return
    const fragment = this.selection // If it already exists, convert from inline->named

    if (this.allFragments.has(fragment)) {
      // only if not already named,
      const existingName = this.allFragments.get(fragment)
      if (existingName) return this.duplicatedFragments.get(existingName)
      const name = uniquify(fragment.toString(), name =>
        this.duplicatedFragments.has(name)
      )
      this.duplicatedFragments.set(name, this)
      this.allFragments.set(fragment, name)
      return
    } // Add as inline first

    this.allFragments.set(fragment, undefined)
  }

  get path() {
    return this.parent ? [...this.parent.path, this] : [this]
  }

  get alias() {
    if (!(this.selection instanceof FieldSelection)) return
    return getAlias(this)
  }

  get key() {
    if (!(this.selection instanceof FieldSelection)) return
    return this.alias || this.selection.field.name
  }

  toString() {
    return this.path.map(t => t.selection.toString()).join('.')
  }
}

__decorate([computed], SelectionTree.prototype, 'path', null)

__decorate([computed], SelectionTree.prototype, 'alias', null)

__decorate([computed], SelectionTree.prototype, 'key', null)

const toTree = selections => {
  const rootTree = new SelectionTree({
    toString: () => 'RootTree',
  })

  const addSelectionToTree = (tree, ...pathToSelection) => {
    for (let i = 0; i < pathToSelection.length; i++) {
      const selection = pathToSelection[i] // Filter out empty fragments

      if (selection instanceof Fragment) {
        // try and find a non-empty fragment somewhere after the path
        // TODO fixme: this doesn't work for nested fragments that are empty
        // eg.
        //  frag A { ... B } -> A should be ignored
        //  frag B { }
        const validSelection = pathToSelection
          .slice(i)
          .find(s => !(s instanceof Fragment) || s.selections.size)
        if (!validSelection) return
      }

      let index = tree.children.findIndex(t => t.selection === selection)

      if (index > -1) {
        tree = tree.children[index]
      } else {
        const newTree = new SelectionTree(selection, tree)
        tree.children.push(newTree)
        tree = newTree
      } // Add all the keySelections to the tree

      selection.keySelections.forEach(keySelection => {
        addSelectionToTree(tree, keySelection)
      })
    }

    const selection = pathToSelection[pathToSelection.length - 1]
    selection.selections.forEach(selection =>
      addSelectionToTree(tree, selection)
    )
  }

  selections.forEach(selections =>
    addSelectionToTree(
      rootTree,
      ...(Array.isArray(selections) ? selections : [selections])
    )
  )
  return rootTree
}

const buildFragments = ({ SPACE, NEWLINE, hug, indent, formatter }, tree) => {
  if (formatter.options.fragments === 'inline') return ''

  const buildFragment = (name, fragmentTree) => {
    return `fragment ${name} on ${fragmentTree.selection.node}${SPACE}${hug(
      indent(buildSelections(formatter, fragmentTree))
    )}`
  }

  return Array.from(tree.duplicatedFragments)
    .map(([name, tree]) => buildFragment(name, tree))
    .join(NEWLINE)
}

const buildQuery = (
  { SPACE, SEPARATOR, NEWLINE, hug, indent, formatter },
  queryName,
  ...selectionPaths
) => {
  const rootTree = toTree(selectionPaths).children[0]
  const variablesMap = new Map()
  const selections = buildSelectionTree(formatter, rootTree, variablesMap)

  const buildVariables = () => {
    if (!variablesMap.size) return ''
    return `(${Array.from(variablesMap)
      .map(([name, variable]) => `$${name}:${SPACE}${variable}`)
      .join(SEPARATOR)})`
  }

  const queryHeader = `${queryName ? ' ' + queryName : ''}${buildVariables()}`
  const query = [
    `${queryHeader ? `query${queryHeader}${SPACE}` : ''}${hug(
      indent(selections)
    )}`,
    buildFragments(formatter, rootTree),
  ]
    .filter(Boolean)
    .join(NEWLINE + NEWLINE)
  let variables

  if (variablesMap.size) {
    variables = {}
    variablesMap.forEach(
      (variable, name) => (variables[name] = variable.toJSON())
    )
  }

  return {
    rootTree,
    query,
    variables,
  }
}

class Formatter {
  constructor({
    prettify = process.env.NODE_ENV !== 'production',
    variables = false,
    fragments = 'inline',
  } = {}) {
    this.formatter = this

    this.indent = string => {
      if (!this.SPACE) return string
      return string.replace(/^/gm, this.SPACE.repeat(2))
    }

    this.hug = string => {
      return `{${this.NEWLINE}${string}${this.NEWLINE}}`
    }

    this.options = {
      prettify,
      variables,
      fragments,
    }
    this.SPACE = prettify ? ' ' : ''
    this.SEPARATOR = `,${this.SPACE}`
    this.LINE_SEPARATOR = prettify ? `\n` : this.SEPARATOR
    this.NEWLINE = prettify ? '\n' : ''
  }
}

const argsFormatter =
  /*#__PURE__*/
  new Formatter({
    prettify: false,
    variables: false,
  })
class FieldSelection extends Selection {
  constructor(field, args) {
    super(field.ofNode)
    this.field = field
    this.args = args
  }

  toString() {
    const args = this.args
      ? `(${buildArguments(argsFormatter, this.args, {
          node: this.field.args,
        })})`
      : ''
    return this.field.name + args
  }
}

class Fragment extends Selection {
  constructor(node, name) {
    super(node)
    this.name = name
  }

  toString() {
    return this.name || `${this.node || ''}Fragment`
  }
}

const selectionsForKey = (key, ...selectionsFilter) => {
  const selections = []

  for (const selection of selectionsFilter) {
    if (selection instanceof Fragment) {
      selections.push(...selectionsForKey(key, ...selection.selections))
      continue
    }

    if (selection.toString() === key) {
      selections.push(selection)
    }
  }

  return selections
}

class NodeEntry {
  constructor(node) {
    this.node = node
    this.instances = new Set()
    this.keys = new Map()
  }

  match(data) {
    !(this.node instanceof Matchable)
      ? process.env.NODE_ENV !== 'production'
        ? invariant(false, `${this.node} does not support pattern matching`)
        : invariant(false)
      : void 0

    for (const value of this.instances) {
      const exactValue = this.node.match(value, data)
      if (exactValue)
        return {
          value,
          exactValue,
        }
    }

    return
  }

  getByKey(key) {
    // First try and find key directly
    if (this.keys.has(key)) return this.keys.get(key) // else find structurally equal value

    for (const [possibleKey, value] of this.keys) {
      if (keyIsEqual(key, possibleKey)) return value
    }

    return undefined
  }

  toJSON(deep = true) {
    const keys = {}
    this.keys.forEach((value, key) => {
      keys[stringify(key)] = deep === true ? value.toJSON() : value
    })
    return {
      keys,
      instances: Array.from(this.instances).map(value =>
        deep === true ? value.toJSON() : value
      ),
    }
  }
}

const getKeyFromCache = (cache, value, extensions) => {
  const node = value.node
  let entry = cache.entries.get(node) // Iterate through extensions and call GET_KEY
  // if the key exists in the cache, then return it
  // else create a new cache entry

  let preferedKey
  let result

  for (const extension of extensions) {
    var _entry

    if (!extension.isKeyable) continue
    const key = extension.getKey(value)
    if (!keyIsValid(key)) continue
    if (!keyIsValid(preferedKey)) preferedKey = key // Check to see if the key already exists in cache

    const keyedValue =
      (_entry = entry) === null || _entry === void 0
        ? void 0
        : _entry.getByKey(key)

    if (!result && keyedValue) {
      result = {
        key,
        value: keyedValue,
      } // if there's no value, complete loop before returning

      if (value) return result
    }
  }

  if (result) return result // no keyed extension found

  if (!keyIsValid(preferedKey) || !value) return

  if (!entry) {
    entry = new NodeEntry(node)
    cache.entries.set(node, entry)
  } // add a new key to cache

  entry.keys.set(preferedKey, value)
  return {
    key: preferedKey,
    value,
  }
}

const FIELD_NAME = /^([^(]+)\(?/
/**
 * Merge-updates a value
 * @param value value to update
 * @param data data to merge
 * @param extensions (optional) pass to enable cache keys
 * @param selectionsFilter (optional) pass to filter merging
 *
 * @returns mergeFiltered - merges the data omitted by selectionsFilter
 */

const merge = (cache, value, data, extensions = [], ...selectionsFilter) => {
  if (value.node instanceof ScalarNode || value.node instanceof EnumNode) {
    mergeScalar(value, data)
    return
  }

  const wasNull = value.data === null
  const isNull = data === null // don't do anything if both are null

  if (wasNull && isNull) return // simply update for null

  if (isNull) {
    value.data = null
    return
  }

  if (value.node instanceof ObjectNode) {
    if (wasNull) value.data = {}
    return iterateObject(cache, value, data, extensions, ...selectionsFilter)
  }

  if (value.node instanceof ArrayNode) {
    // Update the array length (removing values if needed)
    value.data = wasNull ? [] : value.data.slice(0, data.length)
    iterateArray(cache, value, data, extensions)
    return
  }

  return
}

const keyedMerge = (cache, node, data, extensions, ...selectionsFilter) => {
  const keyFragments = []

  for (const { fragment } of extensions) {
    if (!fragment) continue
    if (keyFragments.includes(fragment)) continue
    keyFragments.push(fragment)
  }

  if (!keyFragments.length) return // Create a *temporary* value with the fields needed to perform a key-operation

  const keyedValue = createValue(node, data) // Merge only the fields required for a key-op into the new value

  const completeMerge = merge(
    cache,
    keyedValue,
    data,
    extensions,
    ...keyFragments
  ) // Find a key, and get value from cache

  const result = getKeyFromCache(cache, keyedValue, extensions) // No result, discard keyedValue

  if (!result) return // If the value was already in the cache,
  // discard keyedValue and merge oncemore

  if (result.value !== keyedValue) {
    merge(cache, result.value, data, extensions, ...selectionsFilter)
  } else {
    // Value wasn't in cache, so merge the rest of data
    // on the keyedValue
    completeMerge === null || completeMerge === void 0
      ? void 0
      : completeMerge()
  }

  return result.value
}

const mergeScalar = (value, data) => {
  // Scalar's can't be keyed, so simply update
  value.data = data
}

const iterateArray = (
  cache,
  arrayValue,
  data,
  arrayExtensions,
  ...selectionsFilter
) => {
  data.forEach((data, key) => {
    const node = arrayValue.node.ofNode
    const nodeImplementation = getAbstractImplementation(
      node,
      data === null || data === void 0 ? void 0 : data.__typename
    )
    const extensions = extensionsForKey(
      arrayExtensions,
      e => e.childIndex(),
      node,
      nodeImplementation,
      node
    )
    let value = arrayValue.get(key)
    const keyedValue = keyedMerge(
      cache,
      nodeImplementation || node,
      data,
      extensions,
      ...selectionsFilter
    )

    if (keyedValue) {
      arrayValue.set(key, keyedValue)
      return
    }

    if (!value) {
      value = createValue(nodeImplementation || node, data)
      arrayValue.set(key, value)
    }

    merge(cache, value, data, extensions, ...selectionsFilter)
  })
}

const iterateObject = (
  cache,
  objectValue,
  objectData,
  objectExtensions,
  ...selectionsFilter
) => {
  function mergeObjectKey(key, ...filteredSelections) {
    let fieldName = key

    if (!(key in objectValue.node.fields)) {
      var _fieldName$match

      fieldName =
        (_fieldName$match = fieldName.match(FIELD_NAME)) === null ||
        _fieldName$match === void 0
          ? void 0
          : _fieldName$match[1]
      if (!fieldName || !(fieldName in objectValue.node.fields)) return
    }

    const field = objectValue.node.fields[fieldName]
    const data = objectData[key]
    const node = field.ofNode
    const nodeImplementation = getAbstractImplementation(
      node,
      data === null || data === void 0 ? void 0 : data.__typename
    )
    const extensions = extensionsForKey(
      objectExtensions,
      e => e.childField(field),
      nodeImplementation,
      node
    )
    let value = objectValue.get(key)
    const keyedValue = keyedMerge(
      cache,
      nodeImplementation || node,
      data,
      extensions,
      ...filteredSelections
    )

    if (keyedValue) {
      objectValue.set(key, keyedValue)
      return
    }

    if (!value) {
      value = createValue(nodeImplementation || node, data)
      objectValue.set(key, value)
    }

    merge(cache, value, objectData[key], extensions, ...filteredSelections)
  }

  const mergeFiltered = []

  for (const key in objectData) {
    if (key === '__typename') continue
    const selections = selectionsForKey(key, ...selectionsFilter) // If it's not selected, add to mergeFiltered

    if (selectionsFilter.length && !selections.length) {
      mergeFiltered.push(() => mergeObjectKey(key, ...selections))
      continue
    }

    mergeObjectKey(key, ...selections)
  }

  return mergeFiltered.length
    ? () => {
        for (const merge of mergeFiltered) {
          merge()
        }
      }
    : undefined
}

const createPath = (accessor, data) => {
  if (accessor.value) return accessor.value
  const parentValue = accessor.parent && createPath(accessor.parent)
  const nodeImplementation = getAbstractImplementation(
    accessor.node,
    data === null || data === void 0 ? void 0 : data.__typename
  )
  const value = createValue(nodeImplementation || accessor.node, data)

  if (parentValue) {
    parentValue.set(accessor.toString(), value)
  }

  return value
}

let currentTransaction
class Transaction {
  constructor() {
    this.callbacks = new Set()
  }

  begin() {
    if (currentTransaction) return
    currentTransaction = this
  }

  end() {
    if (currentTransaction !== this) return
    currentTransaction = undefined
    this.flush()
  }

  flush() {
    const callbacks = Array.from(this.callbacks)
    this.callbacks.clear()
    callbacks.forEach(callback => callback())
  }

  onComplete(callback) {
    this.callbacks.add(callback)
  }
}
const afterTransaction = callback => {
  if (currentTransaction) {
    currentTransaction.onComplete(callback)
    return
  }

  callback()
}

class Cache extends Disposable {
  constructor(node) {
    super()
    this.entries = new Map()
    this.onRootValueChange = createEvent()
    this.onRootValueChange.listen(() => {
      if (this.references) this.references.dispose()
      this.references = deepReference(this.rootValue)

      const addToEntries = value => {
        if (!this.entries.has(value.node))
          this.entries.set(value.node, new NodeEntry(value.node))
        const graphNode = this.entries.get(value.node)
        if (graphNode.instances.has(value)) return
        graphNode.instances.add(value)
      }

      addToEntries(this.rootValue)
      this.references.onReference.listen(addToEntries)
      this.references.onUnreference.listen(value => {
        if (!this.entries.has(value.node)) return
        const graphNode = this.entries.get(value.node)
        graphNode.instances.delete(value)
      })
    })
    this.rootValue = new Value(node)
  }

  get rootValue() {
    return this._rootValue
  }

  set rootValue(value) {
    const prevValue = this._rootValue
    if (value === prevValue) return
    this._rootValue = value
    this.onRootValueChange.emit(value)
  }

  merge(accessor, data) {
    const transaction = new Transaction()
    transaction.begin()
    const value = createPath(accessor, data)
    merge(this, value, data, accessor.extensions)
    transaction.end()
  }

  toJSON(deep = true) {
    const types = {}
    this.entries.forEach(nodeEntry => {
      types[nodeEntry.node.toString()] =
        deep === true ? nodeEntry.toJSON() : nodeEntry
    })
    return {
      data: deep === true ? this.rootValue.toJSON() : this.rootValue,
      types,
    }
  }

  dispose() {
    super.dispose()
    this.references.dispose()
  }
}

class Plugins {
  constructor() {
    this.plugins = []
    this.all = new Proxy(
      {},
      {
        get: (_, key) => (...args) => {
          return this.plugins
            .filter(plugin => key in plugin)
            .map(plugin => plugin[key](...args))
        },
      }
    )
    this.first = new Proxy(
      {},
      {
        get: (_, key) => (...args) => isCorrectValue => {
          for (const plugin of this.plugins.filter(plugin => key in plugin)) {
            const value = plugin[key](...args)
            if (isCorrectValue(value)) return value
          }
        },
      }
    )
  }

  add(...args) {
    if (args.length === 1 && typeof args[0] === 'function') {
      const plugin = args[0]
      this.plugins = plugin(this.plugins)
    } else {
      this.plugins.push(...args)
    }
  }

  remove(...plugins) {
    plugins.forEach(plugin => {
      const idx = this.plugins.indexOf(plugin)

      if (idx > -1) {
        this.plugins.splice(idx, 1)
      }
    })
  }
}

/**
 * This algorithmn take a stack of queries, and determines
 * what query each stack should use
 * eg.
 *  [App, Profile] => Profile
 *  [App, Profile, Name] => Profile
 *  [App, Navbar] => App
 *  [App, Profile, Name] => App
 * I'm sure this could be optimized further but it was a pain to get working
 */
const queriesFromStacks = stacks => {
  const queryWeights = new Map()

  const getWeights = query => {
    if (queryWeights.has(query)) {
      return queryWeights.get(query)
    }

    const weights = {
      amount: 0,
      count: 0,
    }
    queryWeights.set(query, weights)
    return weights
  } // Iterate stacks and caculate weights

  stacks.forEach(stack => {
    stack.forEach((query, i) => {
      const amount = stack.length - i
      const weights = getWeights(query)
      weights.count++
      weights.amount += amount
    })
  }) // Calculate priority

  const sortedWeights = Array.from(queryWeights).sort(
    ([, a], [, b]) => b.count - a.count || b.amount - a.amount
  ) // Calculate query priorities

  sortedWeights.forEach(([_, weight], idx) => {
    if (idx > 0) {
      const prevWeight = sortedWeights[idx - 1][1]

      if (
        weight.amount / weight.count ===
        prevWeight.amount / prevWeight.count
      ) {
        weight.priority = prevWeight.priority
        return
      }
    }

    weight.priority = idx
  })
  const finalQueries = new Set()
  const queriesCount = new Map()
  const possibleQueries = stacks.map(stack => {
    let possibleQueries = []
    const stackSize = stack.length - 1 // Iterate in reverse, as the best possible query
    // is most likely to be at the end

    for (let i = stackSize; i >= 0; i--) {
      const query = stack[i]
      const { priority } = queryWeights.get(query)

      {
        // If it's the same rating, add to possible queries
        {
          possibleQueries.push(query)
        }
      }
    }

    if (possibleQueries.length === 1) {
      finalQueries.add(possibleQueries[0])
    } else {
      possibleQueries.forEach(query => {
        queriesCount.set(query, (queriesCount.get(query) || 0) + 1)
      })
    }

    return possibleQueries
  }) // Works for 80% of cases, but it depends on the order the entries are passed in

  return possibleQueries.map(possibleQueries => {
    let highestCount
    let chosenQuery

    for (const query of possibleQueries) {
      if (finalQueries.has(query)) return query
      const count = queriesCount.get(query)

      if (highestCount === undefined || count > highestCount) {
        highestCount = count
        chosenQuery = query
      }
    }

    finalQueries.add(chosenQuery)
    return chosenQuery
  })
}

class Query {
  constructor(
    name,
    /**
     * By default, queries with the same name
     * will refer to the same query.
     * Set this to true to disable
     */
    unique
  ) {
    this.name = name

    if (Query.instances.has(name)) {
      if (!unique) return Query.instances.get(name)
    } else {
      Query.instances.set(name, this)
    }
  }

  toString() {
    return this.name || '(unnamed)'
  }
}
Query.instances =
  /*#__PURE__*/
  new Map()

const defaultQuery =
  /*#__PURE__*/
  new Query()
class Commit extends Disposable {
  constructor(plugins, stack, fetchAccessors) {
    super()
    this.plugins = plugins
    this.stack = stack
    this.fetchAccessors = fetchAccessors
    this.onActive = createEvent()
    this.onIdle = createEvent()
    this.onFetched = createEvent()
    this.accessors = new Map()
  }

  stageUntilValue(accessor) {
    if (!accessor.resolved) return
    if (accessor.value) return
    const unstage = this.stage(accessor)
    this.addDisposer(
      accessor.onValueChange.then(unstage),
      accessor.onResolvedChange.then(resolved => {
        if (!resolved) unstage()
      })
    )
    return unstage
  }

  stage(accessor, ...queries) {
    const unstage = () => this.unstage(accessor) // If the accessor is in this current commit,
    // or being (re-)fetched from a previous commit, don't re-fetch it

    if (this.disposed || accessor.status !== NetworkStatus.idle) return unstage
    if (!this.accessors.size) this.onActive.emit()
    accessor.status = accessor.value
      ? NetworkStatus.updating
      : NetworkStatus.loading
    this.accessors.set(accessor, [...this.stack, ...queries]) // If we already have the parent, remove the
    // parent to narrow down the accessors. This is used when a accessor is created
    // this could cause issues later, may need to add a recurse field to handle polling etc.

    if (accessor.parent && this.accessors.has(accessor.parent)) {
      this.unstage(accessor.parent)
    }

    return unstage
  }

  unstage(accessor) {
    if (this.disposed) return // Only if the accessor is in our commits, set it as not fetching
    // otherwise it could be from a previous commit

    if (this.accessors.has(accessor)) {
      accessor.status = NetworkStatus.idle
    }

    this.accessors.delete(accessor)
    if (!this.accessors.size) this.onIdle.emit()
  }

  async fetch() {
    if (!this.accessors.size) return
    const accessors = Array.from(this.accessors.keys())
    const stacks = Array.from(this.accessors.values())
    const stackQueries = queriesFromStacks(stacks)
    const queries = new Map() // Iterate over stacks and convert into query map

    stackQueries.forEach((query, idx) => {
      if (query === undefined) {
        stackQueries[idx] = query = defaultQuery
      }

      const accessor = accessors[idx]

      if (queries.has(query)) {
        const accessors = queries.get(query)
        accessors.push(accessor)
        return
      }

      queries.set(query, [accessor])
    })
    this.plugins.all.onCommit({
      stacks,
      stackQueries,
      accessors,
      queries,
    })

    try {
      const promises = Array.from(queries)
        .map(async ([query, accessors]) => {
          const promise = this.fetchAccessors(accessors, query && query.name)

          try {
            await promise
          } finally {
            accessors.forEach(accessor => {
              accessor.status = NetworkStatus.idle
            })
          }
        })
        .filter(Boolean)
      await Promise.all(promises)
    } catch (e) {
      console.error(e)
    }

    this.onFetched.emit()
  }
}

class Scheduler extends Disposable {
  constructor(
    fetchAccessors,
    plugins = new Plugins(),
    interval = 50 + (process.env.NODE_ENV !== 'production' ? 100 : 0)
  ) {
    super()
    this.fetchAccessors = fetchAccessors
    this.plugins = plugins
    this.interval = interval
    this.stack = []
    this.commit = undefined
    this.startTimer()
    this.addDisposer(this.clearTimer)
  }

  pushStack(...queries) {
    this.stack.push(...queries)
  }

  popStack(...queries) {
    for (let i = queries.length - 1; i >= 0; i--) {
      const query = queries[i]
      const idx = this.stack.length - 1
      !(this.stack[idx] === query)
        ? process.env.NODE_ENV !== 'production'
          ? invariant(
              false,
              `Scheduler#popStack called with '${query}', but not last in stack [${this.stack.join(
                ', '
              )}]`
            )
          : invariant(false)
        : void 0
      this.stack.splice(idx, 1)
    }
  }

  startTimer() {
    this.clearTimer() // Don't create new Commit, if prev one unused

    if (!this.commit || this.commit.accessors.size) {
      if (this.commit) this.commit.dispose()
      this.commit = new Commit(this.plugins, this.stack, this.fetchAccessors)
    }

    const { commit } = this
    commit.onActive.then(() => {
      this.timer = setTimeout(() => {
        commit.fetch()
        this.startTimer()
      }, this.interval)
      commit.onIdle.then(() => {
        if (commit !== this.commit) return // Cancel timer, and wait until commit is active again

        this.startTimer()
      })
    })
  }

  clearTimer() {
    clearTimeout(this.timer)
  }
}

// & types are different -> emit

const onDataChange = accessor => {
  const onDataChange = createEvent()
  let dispose

  const onValueAssociated = (value, prevValue) => {
    var _dispose

    ;(_dispose = dispose) === null || _dispose === void 0 ? void 0 : _dispose()
    dispose = undefined // Hook for onDataUpdate event

    const check = () => {
      const newData = value === null || value === void 0 ? void 0 : value.data
      const prevData =
        prevValue === null || prevValue === void 0 ? void 0 : prevValue.data
      if (newData === prevData) return

      if (
        prevData !== undefined ||
        newData === null ||
        accessor.node instanceof ScalarNode ||
        accessor.node instanceof EnumNode
      ) {
        onDataChange.emit(prevData)
      }
    }

    if (!value) {
      check()
      return
    }

    dispose = value.onChange.listen(check)
    check()
  }

  accessor.addDisposer(accessor.onValueChange.listen(onValueAssociated))
  onValueAssociated(undefined, accessor.value)
  return onDataChange
}

const syncValue = (accessor, getFromValue, withAccessor = accessor.parent) => {
  if (!withAccessor) return
  const isFn = typeof getFromValue === 'function'

  const getValue = value => {
    if (isFn) return getFromValue(value)
    return value.get(getFromValue)
  }

  let dispose

  const associateValue = () => {
    if (dispose) {
      accessor.deleteDiposer(dispose)
      dispose()
      dispose = undefined
    }

    if (withAccessor.value) {
      accessor.value = getValue(withAccessor.value)
      const onChange = isFn
        ? withAccessor.value.onChange
        : withAccessor.value.onSet.filter(k => k === getFromValue)
      dispose = onChange.listen(() => {
        accessor.value = getValue(withAccessor.value)
      })
      accessor.addDisposer(dispose)
      return
    }

    accessor.value = undefined
  }

  accessor.addDisposer(withAccessor.onValueChange.listen(associateValue))
  associateValue()
}

const accessorInterceptors =
  /*#__PURE__*/
  new Set()
class Interceptor {
  constructor() {
    this.listening = false
    this.onAccessor = createEvent()
  }

  start() {
    accessorInterceptors.add(this.onAccessor.emit)
    this.listening = true
  }

  stop() {
    accessorInterceptors.delete(this.onAccessor.emit)
    this.listening = false
  }
}

var NetworkStatus

;(function(NetworkStatus) {
  NetworkStatus[(NetworkStatus['idle'] = 0)] = 'idle'
  NetworkStatus[(NetworkStatus['loading'] = 1)] = 'loading'
  NetworkStatus[(NetworkStatus['updating'] = 2)] = 'updating'
})(NetworkStatus || (NetworkStatus = {}))

const ACCESSOR =
  /*#__PURE__*/
  Symbol() // A query was made with minimal fields on it
// to save bandwidth - predicted the IDs would match up
// But returned ID were different, so refetch everything

const KEYED_REFETCH =
  /*#__PURE__*/
  new Query('KeyedRefetch')
const memoized =
  /*#__PURE__*/
  createMemo()
class Accessor extends Disposable {
  constructor(parent, selection, node = selection.node) {
    super()
    this.parent = parent
    this.selection = selection
    this.node = node // Ordered by most important -> least

    this.extensions = []
    this.children = []
    this.scheduler = this.parent ? this.parent.scheduler : undefined
    this.cache = this.parent ? this.parent.cache : undefined
    this._status = NetworkStatus.idle
    this._resolved = true
    this.onValueChange = createEvent() // Equality check only

    this.onDataChange = onDataChange(this)
    this.onResolvedChange = createEvent()
    this.onStatusChange = createEvent()
    this.onInitializeExtensions = createEvent()

    if (parent) {
      parent.children.push(this)
      this.addDisposer(
        // On un-select, dispose of self
        // used when you do `query.users()`, and an argumentless
        // selection is created before the function call
        parent.selection.onUnselect
          .filter(s => s === selection)
          .listen(() => this.dispose())
      )
    } // Update the extensions change when:
    // - data changes (from null -> object)
    // - parent extensions change

    this.addDisposer(
      this.onDataChange.listen(() => {
        this.data = undefined
        this.loadExtensions()
      }),
      parent === null || parent === void 0
        ? void 0
        : parent.onInitializeExtensions.listen(() => {
            this.loadExtensions()
          })
    )
  }

  get resolved() {
    return this._resolved
  }

  set resolved(resolved) {
    const prevResolved = this._resolved
    if (prevResolved === resolved) return
    this._resolved = resolved
    this.onResolvedChange.emit(resolved)
  }

  get data() {
    if (this.fragmentToResolve) {
      return this.fragmentToResolve.data
    }

    if (this._data === undefined) {
      this.data = this.getData()
    }

    accessorInterceptors.forEach(intercept => intercept(this))
    return this._data
  }

  set data(data) {
    this._data = data
  }

  set status(status) {
    const prevStatus = this._status
    this._status = status
    if (prevStatus === status) return
    this.onStatusChange.emit(status, prevStatus)
  }

  get status() {
    return this._status
  }

  set value(value) {
    const prevValue = this._value
    this._value = value
    if (prevValue === value) return
    this.onValueChange.emit(value, prevValue)
  }

  get value() {
    return this._value
  }

  initializeExtensions() {
    const addExtensions = node => {
      let extension = node.extension
      if (!extension) return

      if (extension instanceof ComputableExtension) {
        extension = new ComputedExtension(extension, this)
      }

      this.extensions.unshift(extension)
    }

    if (this.node instanceof Abstract) {
      for (const node of this.node.implementations) {
        addExtensions(node)
      }
    }

    addExtensions(this.node)
  }

  loadExtensions() {
    const prevExtensions = this.extensions
    this.extensions = []
    this.initializeExtensions()
    if (arrayEqual(prevExtensions, this.extensions)) return
    this.onInitializeExtensions.emit()
    if (!this.extensions.length) return // If already a fragment, key fragments should only be added on different types

    const isTopLevel =
      !(this instanceof FragmentAccessor) || this.node !== this.parent.node

    if (isTopLevel) {
      // Add keyFragments
      this.extensions.forEach(({ fragment }) => {
        if (!fragment) return
        if (this.selection === fragment) return
        this.selection.add(fragment, true)
      })
    }

    if (!this.value) {
      // TODO: Should this be here? or in merge.ts
      // Cache redirects
      if (this.cache.entries.has(this.node)) {
        for (const extension of this.extensions) {
          const value = extension.redirect(this)
          if (!(value instanceof Value)) continue
          this.updateValue(value)
          break
        }
      }
    }
  } // Update the value, by modifying the cache

  updateValue(value) {
    var _this$parent

    if (value === this.value) return
    !((_this$parent = this.parent) === null || _this$parent === void 0
      ? void 0
      : _this$parent.value)
      ? process.env.NODE_ENV !== 'production'
        ? invariant(
            false,
            `can't update ${this.path} value without parent value`
          )
        : invariant(false)
      : void 0
    const valueless = new Set(this.children.filter(a => !a.value))
    this.parent.value.set(this.toString(), value)
    afterTransaction(() => {
      const accessorWithoutValue = this.children.find(
        a => !a.value && !valueless.has(a)
      ) // If a child accessor is missing a value, then
      // re-fetch it entirely

      if (accessorWithoutValue) {
        this.scheduler.commit.stage(this, KEYED_REFETCH)
      }
    })
  }

  getData(ctx) {
    return undefined
  }

  setData(data) {
    // @TODO
    console.log('set', this.path.toString(), data)
    this.cache.merge(this, data)
  }

  get(find) {
    if (typeof find === 'function') {
      return this.children.find(find)
    }

    if (find instanceof Selection) {
      const accessor = this.children.find(c => c.selection === find)
      return accessor
    }

    return this.children.find(c => c.toString() === String(find))
  }

  getDefaultFragment(node) {
    return memoized.fragment(() => {
      const fragment = new Fragment(node)
      this.selectionPath[this.selectionPath.length - 1].add(fragment)
      return fragment
    }, [node, ...this.selectionPath])
  }

  get selectionPath() {
    const basePath = this.parent ? this.parent.selectionPath : new PathArray()
    const path = // Remove duplicated selections
      basePath[basePath.length - 1] === this.selection
        ? basePath
        : new PathArray(...basePath, this.selection)
    return path
  }

  get path() {
    const basePath = this.parent ? this.parent.path : []
    const path = new PathArray(...basePath, this)
    return path
  }

  dispose() {
    super.dispose()

    if (this.parent) {
      const idx = this.parent.children.indexOf(this)

      if (idx !== -1) {
        this.parent.children.splice(idx, 1)
      }

      this.scheduler.commit.unstage(this)
      this.scheduler.commit.accessors.forEach((_, accessor) => {
        // if the accessor begins with this.path
        for (let i = 0; i < this.path.length; i++) {
          if (this.path[i] !== accessor.path[i]) return
        }

        this.scheduler.commit.unstage(accessor)
      })
    }
  }
}

__decorate([computed], Accessor.prototype, 'selectionPath', null)

__decorate([computed], Accessor.prototype, 'path', null)

class FieldAccessor extends Accessor {
  constructor(parent, fieldSelection) {
    super(parent, fieldSelection)
    this.parent = parent
    this._resolved = this.parent.resolved
    this.parent.onResolvedChange.listen(resolved => (this.resolved = resolved))
    syncValue(this, this.toString())
    this.loadExtensions()
    this.scheduler.commit.stageUntilValue(this)
  }

  initializeExtensions() {
    super.initializeExtensions()

    for (let i = this.parent.extensions.length - 1; i >= 0; --i) {
      let extension = this.parent.extensions[i].childField(this.selection.field)
      if (!extension) continue

      if (extension instanceof ComputableExtension) {
        extension = new ComputedExtension(extension, this)
      }

      this.extensions.unshift(extension)
    }
  }

  getData(ctx) {
    return this.selection.field.ofNode.getData({
      accessor: this,
      ...ctx,
    })
  }

  toString() {
    return this.selection.toString()
  }
}

class FragmentAccessor extends Accessor {
  constructor(parent, fragment) {
    super(parent, fragment)
    this.parent = parent
    this._resolved =
      this.parent.resolved &&
      (!this.parent.value || this.parent.value.node === this.selection.node)

    if (fragment.node !== parent.node) {
      this.parent.onValueChange.listen(value => {
        this.resolved =
          this.parent.resolved && (!value || value.node === fragment.node)
      })
    } // Sync value with parent
    // (only if the node is the same)

    syncValue(this, value => (value.node === fragment.node ? value : undefined))
    this.loadExtensions()
  }
  /**
   * Makes the parent temporarily return
   * this accessor's data
   */

  startResolving() {
    const originalAccessor = this.parent.fragmentToResolve
    this.parent.fragmentToResolve = this

    const resetAccessor = () => {
      this.parent.fragmentToResolve = originalAccessor
      removeDisposer()
    }

    const removeDisposer = this.addDisposer(resetAccessor)
    return resetAccessor
  }

  initializeExtensions() {
    // Copy extensions from parent
    for (let i = this.parent.extensions.length - 1; i >= 0; --i) {
      const extension = this.parent.extensions[i]
      if (extension.node !== this.selection.node) continue
      this.extensions.unshift(extension)
    }
  }

  getData(ctx) {
    return this.selection.node.getData({
      accessor: this,
      ...ctx,
    })
  }

  toString() {
    return this.selection.toString()
  }
}

class IndexAccessor extends Accessor {
  constructor(parent, index) {
    super(
      parent,
      parent.selection,
      (parent instanceof IndexAccessor ? parent.node : parent.selection.node)
        .ofNode
    )
    this.parent = parent
    this.index = index
    this._resolved = this.parent.resolved // Sync from parent status

    this.addDisposer(
      this.parent.onStatusChange.listen(status => {
        this.status = status
      })
    )
    this.parent.onResolvedChange.listen(resolved => (this.resolved = resolved))
    syncValue(this, this.toString())
    this.loadExtensions()
    this.scheduler.commit.stageUntilValue(this)
  }

  initializeExtensions() {
    super.initializeExtensions()

    for (let i = this.parent.extensions.length - 1; i >= 0; --i) {
      let extension = this.parent.extensions[i].childIndex()
      if (!extension) continue

      if (extension instanceof ComputableExtension) {
        extension = new ComputedExtension(extension, this)
      }

      this.extensions.unshift(extension)
    }
  }

  getData(ctx) {
    return this.selection.node.ofNode.getData({
      accessor: this,
      ...ctx,
    })
  }

  toString() {
    return `${this.index}`
  }
}

class RootAccessor extends Accessor {
  constructor(selection, scheduler, cache = new Cache(selection.node)) {
    super(undefined, selection)
    this.scheduler = scheduler
    this.cache = cache
    this.value = cache.rootValue
    this.addDisposer(
      cache.onRootValueChange.listen(() => (this.value = cache.rootValue))
    )
    this.loadExtensions()
  } // TODO: This should be replace with a Generic inside accessor

  getData(ctx) {
    return this.selection.node.getData({
      accessor: this,
      ...ctx,
    })
  }

  updateValue(value) {
    this.cache.rootValue = value
  }

  toString() {
    return this.selection.toString()
  }
}

let lastAccessor
let timer
const interceptor =
  /*#__PURE__*/
  new Interceptor()
interceptor.onAccessor.listen(accessor => {
  lastAccessor = accessor
  clearTimeout(timer)
  timer = setTimeout(() => {
    lastAccessor = null
  })
})
interceptor.start()
const getAccessor = input => {
  if (input) {
    // Attempt to lookup symbol
    const accessor = input[ACCESSOR]
    if (accessor) return accessor // Support passing accessor directly

    if (input instanceof Accessor) return input
  } // If a microtask has run since the last referenced
  // accessor was recorded, then it could be subject
  // to race conditions

  !(lastAccessor !== null)
    ? process.env.NODE_ENV !== 'production'
      ? invariant(
          false,
          lastAccessorErrorMessage(
            `microtask occurred since last accessor was intercepted`
          )
        )
      : invariant(false)
    : void 0
  !lastAccessor
    ? process.env.NODE_ENV !== 'production'
      ? invariant(
          false,
          lastAccessorErrorMessage(`no accessors have been referenced yet!`)
        )
      : invariant(false)
    : void 0 // Check to see if lastAccessor is the same value as
  // input. If it is, then return it

  const data = lastAccessor.data
  !(data === input)
    ? process.env.NODE_ENV !== 'production'
      ? invariant(
          false,
          lastAccessorErrorMessage(
            `'${input}' not equal to '${lastAccessor.path}' (last referenced accessor)`
          )
        )
      : invariant(false)
    : void 0
  return lastAccessor
}

const lastAccessorErrorMessage = message =>
  `Indeterminate accessor! ${message}\n\n` +
  `Ensure calls to getAccessor() *always* dereference data inside the call\n\n` +
  `GOOD : \`getAccessor(user.name)\`\n` +
  `BAD  : \`getAccessor(name)\`\n`

class FieldsNode {
  constructor(fields, { name }) {
    this.name = name
    this.fields = lazyGetters(fields, (fieldName, field) => {
      // Called when the getter prop is evaluated
      field.name = fieldName
    })
  }

  toString() {
    return this.name
  }
}

const interceptAccessor = ctx => {
  if (!ctx.accessor) return
  accessorInterceptors.forEach(intercept => intercept(ctx.accessor))
}
const getExtensions = ctx => {
  if (ctx.extensions) return ctx.extensions
  if (ctx.accessor) return ctx.accessor.extensions
  return []
}
const getSelection = ctx => {
  if (ctx.selection) return ctx.selection
  if (ctx.accessor) return ctx.accessor.selection
  return
}
const getValue = ctx => {
  if (ctx.value) return ctx.value
  if (ctx.accessor) return ctx.accessor.value
  return
}

class EnumNode {
  constructor({ name } = {}) {
    this.name = name
  }

  toString() {
    return this.name || this.constructor.name
  }

  getData(ctx) {
    interceptAccessor(ctx)
    const value = getValue(ctx)
    if (!value) return null
    return value.data
  }
}

const REDIRECT =
  /*#__PURE__*/
  Symbol()
const INDEX =
  /*#__PURE__*/
  Symbol()
const GET_KEY =
  /*#__PURE__*/
  Symbol()
const keyIsValid = key => key != null
const keyIsEqual = (a, b) => deepJSONEqual(a, b)

const createExtension = (node, extension, parent, keyedBy) =>
  new (typeof extension === 'function' ? ComputableExtension : StaticExtension)(
    parent,
    node,
    extension,
    keyedBy
  )

const memo =
  /*#__PURE__*/
  createMemo()
class Extension {
  constructor(
    parent,
    node,
    /** (optional) An object used to construct fragmentKey */
    fragmentKeyedBy = parent ? undefined : node
  ) {
    this.parent = parent
    this.node = node
    this.fragmentKeyedBy = fragmentKeyedBy
  }

  get fragmentKey() {
    return this.path.map(ref => ref.fragmentKeyedBy).filter(Boolean)
  }

  get fragment() {
    var _this$data

    const getKey =
      (_this$data = this.data) === null || _this$data === void 0
        ? void 0
        : _this$data[GET_KEY]
    if (!getKey) return
    let node = this.fragmentKey[this.fragmentKey.length - 1]

    if (node instanceof NodeContainer) {
      node = node.innerNode
    } // Fragments only work with InterfaceNode / ObjectNode

    if (!(node instanceof FieldsNode)) return
    return memo.fragment(() => {
      const fragment = new Fragment(node, `Keyed${this.fragmentKey.join('_')}`) // Initialize with selections

      const data = node.getData({
        selection: fragment,
      })
      getKey(data)
      return fragment
    }, this.fragmentKey)
  }

  get isKeyable() {
    var _this$data2

    return !!((_this$data2 = this.data) === null || _this$data2 === void 0
      ? void 0
      : _this$data2[GET_KEY])
  }

  getKey(value) {
    var _this$data3

    const getKey =
      (_this$data3 = this.data) === null || _this$data3 === void 0
        ? void 0
        : _this$data3[GET_KEY]
    if (!getKey) return
    const data = value.node.getData({
      value,
    })
    const key = getKey(data)
    return key
  }

  redirect(accessor) {
    var _this$data4

    const redirect =
      (_this$data4 = this.data) === null || _this$data4 === void 0
        ? void 0
        : _this$data4[REDIRECT]
    if (!redirect) return
    const entry = accessor.cache.entries.get(accessor.node)
    if (!entry) return
    return redirect(
      accessor instanceof FieldAccessor // @TODO: toJSON everything (could be variables)
        ? accessor.selection.args
        : undefined,
      {
        instances: entry.instances,

        match(data) {
          var _entry$match

          return (_entry$match = entry.match(data)) === null ||
            _entry$match === void 0
            ? void 0
            : _entry$match.value
        },

        getByKey(key) {
          return entry.getByKey(key)
        },
      }
    )
  }
  /** Returns a memoized child Extension */

  childIndex() {
    return memo.childIndex(() => {
      var _this$data5

      !(this.node instanceof ArrayNode)
        ? process.env.NODE_ENV !== 'production'
          ? invariant(false)
          : invariant(false)
        : void 0
      const indexExtension =
        (_this$data5 = this.data) === null || _this$data5 === void 0
          ? void 0
          : _this$data5[INDEX]
      if (indexExtension === undefined) return
      return createExtension(this.node.ofNode, indexExtension, this)
    }, [this])
  }
  /** Returns a memoized child Extension, for a given field */

  childField(field) {
    return memo.childField(() => {
      var _this$data6

      !(this.node instanceof FieldsNode)
        ? process.env.NODE_ENV !== 'production'
          ? invariant(false)
          : invariant(false)
        : void 0
      const fieldExtension =
        (_this$data6 = this.data) === null || _this$data6 === void 0
          ? void 0
          : _this$data6[field.name]
      if (fieldExtension === undefined) return
      return createExtension(field.ofNode, fieldExtension, this, field)
    }, [this, field])
  }

  toString() {
    return this.fragmentKey.toString()
  }

  get path() {
    const basePath = this.parent ? this.parent.path : []
    const path = new PathArray(...basePath, this)
    return path
  }
}

__decorate([computed], Extension.prototype, 'fragmentKey', null)

__decorate([computed], Extension.prototype, 'fragment', null)

__decorate([computed], Extension.prototype, 'path', null)

class ComputableExtension extends Extension {
  constructor(parent, node, getData, keyedBy) {
    super(parent, node, keyedBy)
    this.getData = getData
  }

  get data() {
    // TODO: (Optimization) Could instead return data from an instance of ComputedExtension
    // if available. ChildField could then return already-computed instances
    return this.getData(null)
  }
}

__decorate([computed], ComputableExtension.prototype, 'data', null)

class StaticExtension extends Extension {
  constructor(parent, node, data, keyedBy) {
    super(parent, node, keyedBy)
    this.data = data
  }
}

class ComputedExtension extends Extension {
  constructor(parent, accessor) {
    super(parent, parent.node)
    this.accessor = accessor
  }

  get data() {
    const data =
      this.accessor.node instanceof ScalarNode
        ? this.accessor.getData({
            // Remove extensions, to prevent an infinite loop
            extensions: [],
          })
        : this.accessor.data
    return this.parent.getData(data)
  }
}

__decorate([computed], ComputedExtension.prototype, 'data', null)

class Matchable {
  match(value, data) {
    // Direct equal
    if (value.data === data) return value // Support for callback-style

    if (typeof data === 'function') {
      const isAMatch = data(value.data)
      return isAMatch ? (isAMatch instanceof Value ? isAMatch : value) : null
    } // Can only be a match with null
    // if both equal null

    if (value.data === null || data === null) return null
  }
}

class ScalarNode extends Matchable {
  constructor({ name, extension } = {}) {
    super()
    this.name = name

    if (extension) {
      this.extension = createExtension(this, extension)
    }
  }

  match(value, data) {
    const result = super.match(value, data)
    if (result !== undefined) return result

    if (data instanceof RegExp) {
      const input = String(value.data)
      return input.match(data) ? value : undefined
    }

    return
  }

  toString() {
    return this.name || this.constructor.name
  }

  getData(ctx) {
    interceptAccessor(ctx)
    const extensions = getExtensions(ctx)
    const value = getValue(ctx)
    const extension = extensions[0]

    if (extension) {
      return extension.data
    }

    if (!value) return null
    return value.data
  }
}

class NodeContainer {
  constructor(ofNode, nullable = false) {
    this.ofNode = ofNode
    this.nullable = nullable
  }

  get innerNode() {
    if (this.ofNode instanceof NodeContainer) {
      return this.ofNode.innerNode
    }

    return this.ofNode
  }
}

__decorate([computed], NodeContainer.prototype, 'innerNode', null)

class FieldNode extends NodeContainer {
  constructor(node, args, nullable) {
    super(node, nullable)
    this.args = args // This is set inside FieldsNode

    this.name = ''
  }

  get uncallable() {
    return !(
      this.args &&
      (this.args.required ||
        this.ofNode instanceof ScalarNode ||
        this.ofNode instanceof EnumNode)
    )
  }

  getSelection(ctx, args) {
    interceptAccessor(ctx)
    const parentSelection = getSelection(ctx)
    let selection =
      parentSelection === null || parentSelection === void 0
        ? void 0
        : parentSelection.get(selection => {
            if (!(selection instanceof FieldSelection)) return false
            return (
              selection.field.name === this.name &&
              deepJSONEqual(selection.args, args, (a, b) => {
                // If either is a variable they need to be equal
                if (a instanceof Variable || b instanceof Variable)
                  return a === b
                return undefined
              })
            )
          })
    if (selection) return selection
    selection = new FieldSelection(this, args)
    parentSelection === null || parentSelection === void 0
      ? void 0
      : parentSelection.add(selection)
    return selection
  }

  getData(ctx) {
    const getData = selection => {
      var _ctx$value

      if (ctx.accessor) {
        const accessor =
          ctx.accessor.get(selection) ||
          new FieldAccessor(ctx.accessor, selection)
        return accessor.data
      }

      return this.ofNode.getData({
        selection,
        value:
          (_ctx$value = ctx.value) === null || _ctx$value === void 0
            ? void 0
            : _ctx$value.get(selection.toString()),
        extensions: [],
      })
    }

    const argsFn = args => {
      const parsedArgs = args && (Object.keys(args).length ? args : undefined)
      return getData(this.getSelection(ctx, parsedArgs))
    }

    if (!this.uncallable) return argsFn
    let selection
    let data

    const argumentlessData = () => {
      if (selection) return data
      selection = this.getSelection(ctx)
      data = getData(selection)
      return data
    }

    if (this.args) {
      return new Proxy(argsFn, {
        get: (_, prop) => {
          const data = argumentlessData()
          !data
            ? process.env.NODE_ENV !== 'production'
              ? invariant(
                  false,
                  `Cannot read property '${String(
                    prop
                  )}' on null [${selection}]\n\n` +
                    `You should check for null using \`${selection}() && ${selection}().${String(
                      prop
                    )}\``
                )
              : invariant(false)
            : void 0
          const result = data[prop]

          if (typeof result === 'function') {
            return result.bind(data)
          }

          return result
        },
        set: (_, prop, value) => {
          const data = argumentlessData()
          !data
            ? process.env.NODE_ENV !== 'production'
              ? invariant(
                  false,
                  `Cannot set property '${String(
                    prop
                  )}' on null [${selection}]\n\n` +
                    `You should check for null using \`${selection}() && ${selection}().${String(
                      prop
                    )}\``
                )
              : invariant(false)
            : void 0
          data[prop] = value
          return true
        },
      })
    }

    return argumentlessData()
  }

  toString() {
    return this.name
  }
}

const getAbstractImplementation = (node, typename) => {
  if (node instanceof Abstract && typename) {
    const implementation = node.implementations.find(
      i => i.toString() === typename
    )
    !implementation
      ? process.env.NODE_ENV !== 'production'
        ? invariant(false, `'${typename}' is not a valid subtype of ${node}`)
        : invariant(false)
      : void 0
    return implementation
  }

  return
}
class Abstract {
  constructor(implementations) {
    this.implementations = implementations
  }

  getData(ctx) {
    interceptAccessor(ctx)
    const value = getValue(ctx) // If the value is nulled, return null

    if (value) {
      if (value.data === null) return null

      if (ctx.accessor) {
        const fragment = ctx.accessor.getDefaultFragment(value.node)
        const fragmentAccessor =
          ctx.accessor.get(fragment) ||
          new FragmentAccessor(ctx.accessor, fragment)
        return fragmentAccessor.data
      }
    }

    return new Proxy(
      {},
      {
        get: (_, prop) => {
          var _ctx$accessor, _fragment$data

          const fragment =
            (_ctx$accessor = ctx.accessor) === null || _ctx$accessor === void 0
              ? void 0
              : _ctx$accessor.fragmentToResolve
          if (fragment)
            return (_fragment$data = fragment.data) === null ||
              _fragment$data === void 0
              ? void 0
              : _fragment$data[prop]
          if (prop === ACCESSOR) return ctx.accessor

          if (prop === '__typename') {
            var _getValue

            return (_getValue = getValue(ctx)) === null || _getValue === void 0
              ? void 0
              : _getValue.node.toString()
          }

          if (prop === 'toString') return () => this.toString() // fallback to extensions

          for (const extension of getExtensions(ctx)) {
            if (prop in extension.data) return extension.data[prop]
          }
        },
        set: (_, prop, value) => {
          var _ctx$accessor2

          const fragment =
            (_ctx$accessor2 = ctx.accessor) === null ||
            _ctx$accessor2 === void 0
              ? void 0
              : _ctx$accessor2.fragmentToResolve

          if (fragment) {
            const { data } = fragment
            if (data) data[prop] = value
            return true
          } // else set it on the first extension with the property

          for (const extension of getExtensions(ctx)) {
            if (prop in extension) {
              extension.data[prop] = value
              return true
            }
          }

          return true
        },
      }
    )
  }

  toString() {
    return this.implementations.join('|')
  }
}

const memo$1 =
  /*#__PURE__*/
  createMemo()
class ArrayNode extends Mix(Generic(NodeContainer), Matchable) {
  constructor(ofNode, nullable) {
    // memoize instances of ArrayNode
    const existingNode = memo$1([ofNode, nullable])
    if (existingNode) return existingNode
    super([ofNode, nullable])
    memo$1(() => this, [ofNode, nullable])
  }

  match(value, data) {
    const result = super.match(value, data)
    if (result !== undefined) return result // Whole array match

    if (Array.isArray(data)) {
      if (data.length !== value.data.length) return
      const badMatch = data.find((match, i) => {
        const indexValue = value.get(i)
        if (!indexValue) return true
        if (!(indexValue.node instanceof Matchable)) return
        return !indexValue.node.match(indexValue, data[i])
      })
      if (badMatch) return
      return value
    } // Array index match

    const innerNode = value.node.innerNode
    if (!(innerNode instanceof Matchable)) return

    for (const indexValue of value.data) {
      const match = innerNode.match(indexValue, data)
      if (match) return match
    }

    return
  }

  getData(ctx) {
    interceptAccessor(ctx)
    const proxy = new Proxy([], {
      get: (target, prop) => {
        var _getValue

        if (prop === ACCESSOR) return ctx.accessor
        const arr =
          (_getValue = getValue(ctx)) === null || _getValue === void 0
            ? void 0
            : _getValue.data

        if (prop === 'length') {
          var _ref

          return (_ref =
            arr === null || arr === void 0 ? void 0 : arr.length) !== null &&
            _ref !== void 0
            ? _ref
            : 1
        }

        if (prop === 'toString') {
          return () => this.toString()
        }

        if (typeof prop === 'string') {
          const index = +prop

          if (!isNaN(index)) {
            var _ctx$value

            // If the array is fetched, make sure index exists
            if (arr && index >= arr.length) return undefined

            if (ctx.accessor) {
              const accessor =
                ctx.accessor.get(index) ||
                new IndexAccessor(ctx.accessor, index)
              return accessor.data
            }

            return this.ofNode.getData({
              value:
                (_ctx$value = ctx.value) === null || _ctx$value === void 0
                  ? void 0
                  : _ctx$value.get(index),
              selection: ctx.selection,
              extensions: [],
            })
          }
        } // fallback to extensions

        for (const extension of getExtensions(ctx)) {
          if (prop in extension.data) return extension.data[prop]
        }

        const arrayProperty = target[prop]

        if (typeof arrayProperty === 'function') {
          return arrayProperty.bind(proxy)
        }

        return arrayProperty
      },
      has: (target, prop) => {
        const value = getValue(ctx)

        if (value) {
          return value.data ? prop in value.data : false
        } // todo read value

        if (typeof prop === 'string' && !isNaN(+prop)) {
          return true
        }

        return prop in target
      },
    })
    return proxy
  }

  toString() {
    return `[${this.ofNode}${this.nullable ? '' : '!'}]`
  }
}

class InterfaceNode extends Mix(FieldsNode, Generic(Abstract)) {
  constructor(fields, implementations, options) {
    super([fields, options], [implementations])

    if (options.extension) {
      this.extension = createExtension(this, options.extension)
    }
  }

  getData(ctx) {
    // @ts-ignore typescript limitation of mix-classes
    const data = super.getData(ctx)
    if (!data) return data
    return new Proxy(data, {
      get: (_, prop) => {
        var _ctx$accessor, _fragment$data

        const fragment =
          (_ctx$accessor = ctx.accessor) === null || _ctx$accessor === void 0
            ? void 0
            : _ctx$accessor.fragmentToResolve
        if (fragment)
          return (_fragment$data = fragment.data) === null ||
            _fragment$data === void 0
            ? void 0
            : _fragment$data[prop] // If the prop exists in this interface,
        // return directly from interface

        if (this.fields.hasOwnProperty(prop)) {
          const field = this.fields[prop] // if (field.args) {
          //   return (args: any) => {
          //     // forEach key in args
          //     // if key in an implementation, create implementation accessor
          //     // create interface accessor
          //   }
          // }

          return field.getData(ctx)
        } // if prop only in one implementation
        // else throw an error if it doesn't satisfy conditions

        return data[prop]
      },
      set: (_, prop, value) => {
        var _ctx$accessor2

        const fragment =
          (_ctx$accessor2 = ctx.accessor) === null || _ctx$accessor2 === void 0
            ? void 0
            : _ctx$accessor2.fragmentToResolve

        if (fragment) {
          const { data } = fragment
          if (data) data[prop] = value
          return true
        }

        if (prop === '__typename') return true
        /**
         * If setting a field, create a new accessor and set data
         */

        if (this.fields.hasOwnProperty(prop)) {
          if (!ctx.accessor) return true
          const field = this.fields[prop]
          const selection = field.getSelection(ctx)
          const fieldAccessor =
            ctx.accessor.get(selection) ||
            new FieldAccessor(ctx.accessor, selection)
          fieldAccessor.setData(data)
          return true
        }

        data[prop] = value
        return true
      },
    })
  }

  toString() {
    return getMixin(this, FieldsNode).toString()
  }
}

const TYPENAME_NODE =
  /*#__PURE__*/
  new ScalarNode()
class ObjectNode extends Mix(FieldsNode, Matchable) {
  constructor(fields, options) {
    fields.__typename = new FieldNode(TYPENAME_NODE)
    super([fields, options])

    if (options.extension) {
      this.extension = createExtension(this, options.extension)
    }
  }

  match(value, data) {
    const result = super.match(value, data)
    if (result !== undefined) return result
    let matches = 0

    for (const key in data) {
      if (!this.fields.hasOwnProperty(key)) continue
      const field = this.fields[key]
      if (!(field.ofNode instanceof Matchable)) continue
      const keyValue = value.get(key)
      const keyData = data[key]
      if (!keyValue) continue
      const isMatch = field.ofNode.match(keyValue, keyData)
      if (!isMatch) return
      matches++
    }

    return matches ? value : undefined
  }

  getData(ctx) {
    const value = getValue(ctx)
    if ((value === null || value === void 0 ? void 0 : value.data) === null)
      return null
    return new Proxy(
      {},
      {
        get: (_, prop) => {
          var _ctx$accessor, _fragment$data

          const fragment =
            (_ctx$accessor = ctx.accessor) === null || _ctx$accessor === void 0
              ? void 0
              : _ctx$accessor.fragmentToResolve
          if (fragment)
            return (_fragment$data = fragment.data) === null ||
              _fragment$data === void 0
              ? void 0
              : _fragment$data[prop]
          if (prop === ACCESSOR) return ctx.accessor // Statically resolve __typename

          if (prop === '__typename') return this.name // check fields first

          if (this.fields.hasOwnProperty(prop)) {
            const field = this.fields[prop]
            return field.getData(ctx)
          }

          if (prop === 'toString') return () => this.toString() // fallback to extensions

          for (const extension of getExtensions(ctx)) {
            if (prop in extension.data) return extension.data[prop]
          }
        },
        set: (_, prop, value) => {
          var _ctx$accessor2

          const fragment =
            (_ctx$accessor2 = ctx.accessor) === null ||
            _ctx$accessor2 === void 0
              ? void 0
              : _ctx$accessor2.fragmentToResolve

          if (fragment) {
            const { data } = fragment
            if (data) data[prop] = value
            return true
          }

          if (prop === '__typename') return true
          /**
           * If setting a field, create a new accessor and set data
           */

          if (this.fields.hasOwnProperty(prop)) {
            if (!ctx.accessor) return true
            const field = this.fields[prop]
            const selection = field.getSelection(ctx)
            const fieldAccessor =
              ctx.accessor.get(selection) ||
              new FieldAccessor(ctx.accessor, selection)
            fieldAccessor.setData(value)
            return true
          }
          /**
           * else set it on the first extension with the property
           */

          for (const extension of getExtensions(ctx)) {
            if (prop in extension.data) {
              extension.data[prop] = value
              return true
            }
          }

          return true
        },
      }
    )
  }
}

class UnionNode extends Abstract {
  constructor(ofNodes) {
    super(ofNodes)
  }
}

class InputNode {
  constructor(inputs, { name }) {
    this.name = name
    this.inputs = lazyGetters(inputs)
  }

  toString() {
    return this.name || this.constructor.name
  }
}

class InputNodeField extends NodeContainer {
  constructor(node, nullable) {
    super(node, nullable)
  }
}

class Arguments {
  constructor(inputs, required = false) {
    this.required = required
    this.inputs = lazyGetters(inputs, (fieldName, field) => {
      // Called when the getter prop is evaluated
      field.name = fieldName
    })
  }
}

class ArgumentsField extends NodeContainer {
  constructor(node, nullable) {
    super(node, nullable) // This is set inside Arguments

    this.name = ''
  }
}

class Client extends Disposable {
  constructor(node, fetchQuery, { prettifyQueries } = {}) {
    super()
    this.node = node
    this.fetchQuery = fetchQuery
    this.plugins = new Plugins()
    this.scheduler = new Scheduler(
      (accessors, name) => this.fetchAccessors(accessors, name),
      this.plugins
    )
    this.cache = new Cache(this.node)
    this.selection = new Selection(this.node)
    this.accessor = new RootAccessor(this.selection, this.scheduler, this.cache)
    this.query = this.accessor.data
    this.formatter = new Formatter({
      prettify: prettifyQueries,
      fragments: 'auto',
      variables: true,
    })
    this.selection.onSelect.listen(selection => {
      this.plugins.all.onSelect(selection)
    })
    this.selection.onUnselect.listen(selection => {
      this.plugins.all.onUnselect(selection)
    })
  }

  fetchAccessors(accessors, queryName) {
    const result = buildQuery(
      this.formatter,
      queryName,
      ...accessors.map(accessor => accessor.selectionPath)
    )
    if (!result) return

    const responsePromise = (async () => {
      const response = await this.fetchQuery(result.query, result.variables)
      result.rootTree.resolveAliases(response.data)
      this.cache.merge(this.accessor, response.data)
      return response
    })()

    this.plugins.all.onFetch(
      accessors,
      responsePromise,
      result.variables,
      result.query,
      queryName
    )
    return responsePromise
  }

  dispose() {
    super.dispose()
    this.scheduler.dispose()
    this.plugins.all.dispose()
  }
}

// if it's been called from outside

class Poller {
  constructor(data, interval, stack) {
    this.interval = interval
    this.stack = stack
    this.polling = false
    this.accessor = getAccessor(data)
  }

  updateInterval(interval) {
    if (this.interval === interval) return
    this.interval = interval
    this.resetTimer()
  }
  /**
   * Polls the selection, scheduling a new poll
   * only after it's been fetched
   */

  async poll() {
    this.unstage = this.accessor.scheduler.commit.stage(
      this.accessor,
      ...(this.stack || [])
    ) // Wait until it's been fetched, before polling again

    await this.accessor.onStatusChange
    this.unstage = undefined // If we're still polling after we've fetched
    // the selection, then poll again

    if (this.polling) {
      this.pollAfterInterval()
    }
  }

  pollAfterInterval() {
    this.timer = setTimeout(() => this.poll(), this.interval)
  }

  resetTimer() {
    if (this.polling) this.toggle(true)
  }

  toggle(poll = !this.polling) {
    var _this$unstage

    this.polling = poll
    ;(_this$unstage = this.unstage) === null || _this$unstage === void 0
      ? void 0
      : _this$unstage.call(this)
    clearTimeout(this.timer)
    if (!poll) return
    this.pollAfterInterval()
  }
}

/**
 * Updates an accessor, with a compatible Value matching a pattern
 *
 * @example
 * // true for correct matches
 * matchUpdate(query.me, { id: 'Bob' })
 * // => true
 *
 * // returns false for bad matches
 * matchUpdate(query.me, { id: 'no' })
 * // => false
 */

const matchUpdate = (data, pattern) => {
  const accessor = getAccessor(data)
  const entry = accessor.cache.entries.get(accessor.node)
  if (!entry) return false
  const match = entry.match(pattern)
  if (!match) return false
  accessor.updateValue(match.value)
  return true
}

/**
 * Updates the Value for an accessor
 *
 * @example
 * // Update a scalar
 * update(query.me.name, 'bob')
 *
 * // Update an object
 * update(query, { me: { name: 'bob' } })
 */

const update = (data, newData) => {
  const accessor = getAccessor(data)
  return accessor.setData(newData)
}

/**
 * Attaches a fragment to an accessor, and returns the data
 *
 * @example
 * fragmentOn(query.me, new Fragment(schema.User))
 */

const fragmentOn = (data, fragment) => {
  const accessor = getAccessor(data)
  let fragmentAccessor = (accessor instanceof FragmentAccessor
    ? accessor.parent
    : accessor
  ).get(fragment)

  if (!fragmentAccessor) {
    accessor.selection.add(fragment)
    fragmentAccessor = new FragmentAccessor(accessor, fragment)
  }

  return fragmentAccessor.data
}

/**
 * Refetches an accessor
 *
 * @example
 * refetch(query.me)
 */

const refetch = data => {
  const accessor = getAccessor(data)
  accessor.scheduler.commit.stage(accessor)
}

/**
 * Preload a function / React component
 *
 * @example
 * // Preload a React Component
 * preload(UserComponent, { user })
 *
 * // Preload a normal function
 * preload(getFullName, user)
 */

const preload = (_func, ..._args) => {
  // This function will be replaced by babel plugin
  process.env.NODE_ENV !== 'production'
    ? invariant(false, `babel-plugin-gqless is required for preloading`)
    : invariant(false)
}

/**
 * Waits for an accessor / function to be fully resolved,
 * and returns the final value
 *
 * @example
 * const name = await resolved(query.me.name)
 * console.log(name)
 *
 * @example
 * const data = await resolved(() => ({ name: query.me.name }))
 * console.log(data.name)
 *
 * @example
 * await resolved(query.me.name)
 * console.log(query.me.name)
 */

function resolved(data, options) {
  const isResolved = accessor =>
    (options === null || options === void 0 ? void 0 : options.waitForUpdate) ||
    false
      ? accessor.status === NetworkStatus.idle
      : accessor.status !== NetworkStatus.loading

  let accessor

  try {
    accessor = getAccessor(data)
    if (options === null || options === void 0 ? void 0 : options.refetch)
      accessor.scheduler.commit.stage(accessor)
  } catch (err) {
    if (typeof data !== 'function') throw err
    const interceptor = new Interceptor()
    const nonIdleAccessors = new Set()
    interceptor.onAccessor.listen(acc => {
      if (nonIdleAccessors.has(acc)) return
      nonIdleAccessors.add(acc)
      if (options === null || options === void 0 ? void 0 : options.refetch)
        acc.scheduler.commit.stage(acc)
    })
    interceptor.start()

    try {
      var result = data()
    } finally {
      interceptor.stop()
    }

    return new Promise((resolve, reject) => {
      nonIdleAccessors.forEach(acc => {
        if (isResolved(acc)) {
          nonIdleAccessors.delete(acc)
          return
        }

        const dispose = acc.onStatusChange.listen(() => {
          if (!isResolved(acc)) return
          dispose()
          nonIdleAccessors.delete(acc)
          if (nonIdleAccessors.size) return

          try {
            const finalResult = data()
            resolve(finalResult)
          } catch (e) {
            reject(e)
          }
        })
      })

      if (!nonIdleAccessors.size) {
        resolve(result)
      }
    })
  }

  if (isResolved(accessor)) {
    return Promise.resolve(data)
  }

  return new Promise(resolve => {
    // TODO: Support for promise reject
    accessor.onStatusChange.listen(() => {
      if (isResolved(accessor)) resolve(accessor.data)
    })
  })
}

export {
  ACCESSOR,
  Abstract,
  Accessor,
  Arguments,
  ArgumentsField,
  ArrayNode,
  Cache,
  Client,
  ComputableExtension,
  ComputedExtension,
  EnumNode,
  Extension,
  FieldAccessor,
  FieldNode,
  FieldSelection,
  FieldsNode,
  Formatter,
  Fragment,
  FragmentAccessor,
  GET_KEY,
  INDEX,
  IndexAccessor,
  InputNode,
  InputNodeField,
  Interceptor,
  InterfaceNode,
  Matchable,
  NetworkStatus,
  NodeContainer,
  NodeEntry,
  ObjectNode,
  Plugins,
  Poller,
  Query,
  REDIRECT,
  RootAccessor,
  ScalarNode,
  Scheduler,
  Selection,
  SelectionTree,
  StaticExtension,
  Transaction,
  UnionNode,
  Value,
  Variable,
  accessorInterceptors,
  afterTransaction,
  buildArguments,
  buildQuery,
  buildSelectionTree,
  buildSelections,
  createExtension,
  createValue,
  fragmentOn,
  getAbstractImplementation,
  getAccessor,
  getExtensions,
  getSelection,
  getValue,
  interceptAccessor,
  keyIsEqual,
  keyIsValid,
  matchUpdate,
  merge,
  preload,
  refetch,
  resolved,
  toTree,
  update,
}
//# sourceMappingURL=gqless.esm.js.map
