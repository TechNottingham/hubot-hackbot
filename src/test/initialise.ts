import { use } from 'chai'
import * as sinonChai from 'sinon-chai'

process.on('unhandledRejection', (reason: Error) => {
  if (reason.message.slice(0, 6) === '[test]') {
    return
  }
  console.error('\nUnhandled Rejection', reason)
})

process.on('rejectionHandled', (): void => void 0)

before(() => {
  use(sinonChai)
  process.env['HACKBOT_API_URL'] = 'http://localhost:64201'
  process.env['HACKBOT_API_PASSWORD'] = 'not a real password'
})
