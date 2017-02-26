import { Response, Message } from 'hubot'
import { ICustomMessageData } from 'hubot-slack'
import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import * as Helper from 'hubot-test-helper'
import Config from '../config'
import * as random from './random'

describe('Error Handler', () => {

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

  describe('catches an error with Slack adapter', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    let error: Error
    let errorChannel: string
    let response: Response
    let expectedMessage: ICustomMessageData
    let loggerErrorStub: sinon.SinonStub
    let sendSpy: sinon.SinonSpy

    before(() => {
      room.user.name = userName
      error = new Error('[test] catches an error with Slack adapter')
      errorChannel = '#my_error_channel'
      response = new Response(room.robot, new Message(room.user), [])

      Config.HACKBOT_ERROR_CHANNEL.value = errorChannel

      const fallback = `Error responding to message from @${room.user.name}
Command: ${response.message.text}
Error: ${error.message}`
      const text = `Error responding to message from @${room.user.name}
\`\`\`
Command: ${response.message.text}
\`\`\`
\`\`\`
Error: ${error.stack}
\`\`\``

      expectedMessage = {
        attachments: [{
          fallback: fallback,
          color: 'warning',
          title: `Hackbot error caught`,
          text: text,
          mrkdwn_in: ['text'],
        }],
      }

      loggerErrorStub = sinon.stub(robot.logger, 'error')
      sendSpy = sinon.spy(room.robot, 'send')

      room.robot.emit('error', error, response)
    })

    it('should log the error', () => {
      expect(loggerErrorStub).to.have.been.calledWith(error.stack)
    })

    it('should report the error to the user', () => {
      expect(room.messages).to.eql([
        ['hubot', expectedMessage],
        ['hubot', `@${userName} Uhh, sorry, I just experienced an error :goberserk:`],
      ])
    })

    it('should print the message error in the slack error channel', () => {
      expect(sendSpy).to.have.been.calledWith({ room: errorChannel })
    })
  })

  describe('catches an error with Slack adapter not caused by a user', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    let error: Error
    let errorChannel: string
    let expectedMessage: ICustomMessageData
    let loggerErrorStub: sinon.SinonStub
    let sendSpy: sinon.SinonSpy

    before(() => {
      room.user.name = userName
      error = new Error('[test] catches an error with Slack adapter')
      errorChannel = '#my_error_channel'

      Config.HACKBOT_ERROR_CHANNEL.value = errorChannel

      const fallback = `Error: ${error.message}`
      const text = `\`\`\`
Error: ${error.stack}
\`\`\``

      expectedMessage = {
        attachments: [{
          fallback: fallback,
          color: 'warning',
          title: `Hackbot error caught`,
          text: text,
          mrkdwn_in: ['text'],
        }],
      }

      loggerErrorStub = sinon.stub(robot.logger, 'error')
      sendSpy = sinon.spy(room.robot, 'send')

      room.robot.emit('error', error)
    })

    it('should log the error', () => {
      expect(loggerErrorStub).to.have.been.calledWith(error.stack)
    })

    it('should not report the error to a user', () => {
      expect(room.messages).to.eql([
        ['hubot', expectedMessage],
      ])
    })

    it('should print the message error in the slack error channel', () => {
      expect(sendSpy).to.have.been.calledWith({ room: errorChannel })
    })
  })

})
