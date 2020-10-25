'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./logger.cjs.production.min.js')
} else {
  module.exports = require('./logger.cjs.development.js')
}
