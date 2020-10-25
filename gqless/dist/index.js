'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./gqless.cjs.production.min.js')
} else {
  module.exports = require('./gqless.cjs.development.js')
}
