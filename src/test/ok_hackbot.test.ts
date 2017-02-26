import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import { SlackBotClient } from 'hubot-slack'
import { MemoryDataStore } from '@slack/client'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('OK hackbot', () => {

  let helper: Helper.Helper
  let room: Helper.Room
  let robot: RobotWithClient
  let dataStore: MemoryDataStore

  before(() => helper = new Helper('../index.js'))

  function setUp() {
    room = helper.createRoom()
    robot = <RobotWithClient> room.robot
    dataStore = new MemoryDataStore()
    robot.adapter.client = <SlackBotClient> { rtm: { dataStore: dataStore } }
  }

  function tearDown() {
    room.destroy()
  }

  describe('when hackbot is set to listen', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    let brainRemoveStub: sinon.SinonStub
    let brainSetStub: sinon.SinonStub
    let brainGetStub: sinon.SinonStub
    let epochBefore: number
    let receiveSpy: sinon.SinonSpy

    before(async () => {
      epochBefore = new Date().getTime() / 1000
      const epoch = (new Date().getTime() / 1000) - 28

      brainRemoveStub = sinon.stub(robot.brain, 'remove')
      brainSetStub = sinon.stub(robot.brain, 'set')
      brainGetStub = sinon.stub(robot.brain, 'get').onFirstCall().returns(epoch)

      await room.receive(userName, `OK hubot`)

      receiveSpy = sinon.spy(robot, 'receive')

      await room.receive(userName, `some other command`)
      await room.receive(userName, `and another command`)
    })

    it('should store the epoch of the request in the brain', () => {
      expect(brainSetStub.getCall(0)).to.have.been.calledWith(`ok_${userName}`, sinon.match((epoch: number) =>
        epochBefore <= epoch && epoch <= epochBefore + 1,
      ))
    })

    it('should remove the epoch of the first request in the brain', () => {
      expect(brainRemoveStub).to.have.been.calledWith(`ok_${userName}`)
    })

    it('should receive six messages', () => {
      expect(receiveSpy.callCount).to.be.eql(6)
    })

    it('should send the heard command back to the robot with the bot name prefix', () => {
      expect(receiveSpy).to.have.been.calledWith(sinon.match({
        text: `hubot some other command`,
      }))
    })

    it('should not send the following command back to the robot', () => {
      expect(receiveSpy).to.not.have.been.calledWith(sinon.match({
        text: `hubot and another command`,
      }))
    })

    it('should overwrite the epoch of the command in the brain', () => {
      expect(brainSetStub).to.have.been.calledTwice
    })

    it('should trigger OK mode', () => {
      expect(room.messages).to.eql([
        [userName, `OK hubot`],
        ['hubot', `@${userName} Yes?`],
        [userName, `some other command`],
        [userName, `and another command`],
      ])
    })
  })

  describe('when hackbot is set to listen but listener times-out', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    let brainSetStub: sinon.SinonStub
    let brainGetStub: sinon.SinonStub
    let receiveSpy: sinon.SinonSpy

    before(async () => {
      const epoch = (new Date().getTime() / 1000) - 31

      brainSetStub = sinon.stub(robot.brain, 'set')
      brainGetStub = sinon.stub(robot.brain, 'get').returns(epoch)

      await room.receive(userName, `OK hubot`)

      receiveSpy = sinon.spy(robot, 'receive')

      await room.receive(userName, `some other command`)
      await room.receive(userName, `and another command`)
    })

    it('should not send the following commands back to the robot', () => {
      expect(receiveSpy).to.not.have.been.calledWith(sinon.match({
        text: `hubot some other command`,
      }))
      expect(receiveSpy).to.not.have.been.calledWith(sinon.match({
        text: `hubot and another command`,
      }))
    })

    it('should set the epoch of the command in the brain', () => {
      expect(brainSetStub).to.have.been.calledOnce
    })

    it('should trigger OK mode', () => {
      expect(room.messages).to.eql([
        [userName, `OK hubot`],
        ['hubot', `@${userName} Yes?`],
        [userName, `some other command`],
        [userName, `and another command`],
      ])
    })
  })

})
