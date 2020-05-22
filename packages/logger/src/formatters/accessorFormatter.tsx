import { Accessor, RootAccessor, ScalarNode, FragmentAccessor } from 'gqless'

import { Path, Preview, Tree, TreeItem } from './components'
import * as React from './jsx'

export const accessorFormatter = {
  header(accessor: any, config: any = {}) {
    try {
      if (!(accessor instanceof Accessor)) return null

      const path = config.objectDepth
        ? accessor.path.slice(config.objectDepth)
        : accessor.path

      const { children } = accessor
      return (
        <div>
          <Path
            path={path}
            objectDepth={config.objectDepth}
            isRoot={(accessor) => accessor instanceof RootAccessor}
            isFragment={(accessor) => accessor instanceof FragmentAccessor}
          />

          {children.length ? (
            <Preview
              elements={children}
              objectDepth={config.objectDepth}
              colon={!(accessor instanceof FragmentAccessor)}
              isFragment={(accessor) => accessor instanceof FragmentAccessor}
            />
          ) : (
            (config.objectDepth || accessor.node instanceof ScalarNode) && (
              <span>
                {`: `}
                <object
                  // @ts-ignore
                  object={accessor.value ? accessor.value.toJSON() : null}
                />
              </span>
            )
          )}
        </div>
      )
    } catch {
      return null
    }
  },

  body(accessor: Accessor) {
    const children = [...accessor.children]
    children.sort(
      (a, b) =>
        +(b instanceof FragmentAccessor) - +(a instanceof FragmentAccessor)
    )

    return (
      <Tree>
        {children.map((accessor) => (
          <TreeItem
            object={accessor}
            root={!!accessor.children.length}
            objectDepth={accessor.path.length - 1}
          />
        ))}
      </Tree>
    )
  },
  hasBody(accessor: Accessor) {
    return !!accessor.children.length
  },
}
