'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./schema.cjs.production.min.js')
} else {
  module.exports = require('./schema.cjs.development.js')
}
