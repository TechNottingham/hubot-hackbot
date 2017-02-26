import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('Can you see the API?', () => {

  let helper: Helper.Helper
  let room: Helper.Room
  let robot: RobotWithClient

  before(() => helper = new Helper('../index.js'))

  function setUp() {
    room = helper.createRoom()
    robot = <RobotWithClient> room.robot
  }

  function tearDown() {
    room.destroy()
  }

  describe('can see the API', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()

    before(() => {
      sinon.stub(robot.client, 'checkApi').returns(Promise.resolve({ ok: true }))

      return room.user.say(userName, '@hubot can you see the api?')
    })

    it('should reply to the user that the API is available', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot can you see the api?'],
        ['hubot', `@${userName} I'll have a quick look for you...`],
        ['hubot', `@${userName} I see her!`],
      ])
    })
  })

  describe('unable to see the API', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const statusCode = 99

    before(() => {
      sinon.stub(robot.client, 'checkApi').returns(Promise.resolve({ ok: false, statusCode }))

      return room.user.say(userName, '@hubot can you see the api?')
    })

    it('should reply to the user that the API cannot be seen', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot can you see the api?'],
        ['hubot', `@${userName} I'll have a quick look for you...`],
        ['hubot', `@${userName} I'm sorry, there appears to be a problem; something about "${statusCode}"`],
      ])
    })
  })

  describe('unable to see the API because of a http error', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()

    before(() => {
      const error = new Error('[test] unable to see the API because of a http error')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'checkApi').returns(Promise.reject(error))

      return room.user.say(userName, '@hubot can you see the api?')
    })

    it('should not report the error', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot can you see the api?'],
        ['hubot', `@${userName} I'll have a quick look for you...`],
      ])
    })
  })
})
