import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import { SlackBotClient } from 'hubot-slack'
import { MemoryDataStore, User } from '@slack/client'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('@hubot our motto is', () => {

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

  describe('when user in a team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: teamId, name: teamName } = random.team()
    const motto = random.motto()
    let getUserStub: sinon.SinonStub
    let updateMottoStub: sinon.SinonStub

    before(() => {
      getUserStub = sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            id: userId,
            team: {
              id: teamId,
              name: teamName,
            },
          },
        }))

      updateMottoStub = sinon.stub(robot.client, 'updateMotto').returns(Promise.resolve({ ok: true }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot our motto is ${motto}`)
    })

    it('should update the team motto', () => {
      expect(updateMottoStub).to.have.been.calledWith(motto, teamId, userId)
    })

    it('should tell the user the new motto', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot our motto is ${motto}`],
        ['hubot', `@${userName} So it is! As ${teamName} say: ${motto}`],
      ])
    })
  })

  describe('when team exists without permission', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: teamId } = random.team()
    const motto = random.motto()

    before(() => {
      sinon.stub(robot.client, 'getUser').returns(Promise.resolve({
        ok: true,
        user: {
          id: userId,
          team: { id: teamId },
        },
      }))

      sinon.stub(robot.client, 'updateMotto')
        .withArgs(motto, teamId, userId)
        .returns(Promise.resolve({
          ok: false,
          statusCode: 403,
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot our motto is ${motto}`)
    })

    it('should tell the user they do not have permission', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot our motto is ${motto}`],
        ['hubot', `@${userName} Sorry, only team members can change the motto.`],
      ])
    })
  })

  describe('when user not in a team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const motto = random.motto()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            id: userId,
            team: {},
          },
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot our motto is ${motto}`)
    })

    it('should tell the user the motto is changed', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot our motto is ${motto}`],
        ['hubot', `@${userName} You're not in a team! :goberserk:`],
      ])
    })
  })

  describe('when user unknown', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const motto = random.motto()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: false,
          statusCode: 404,
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot our motto is ${motto}`)
    })

    it('should tell the user the motto is changed', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot our motto is ${motto}`],
        ['hubot', `@${userName} You're not in a team! :goberserk:`],
      ])
    })
  })

  describe('Yorkshire folkd', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: teamId, name: teamName } = random.team()
    const motto = random.motto()
    let getUserStub: sinon.SinonStub
    let updateMottoStub: sinon.SinonStub

    before(() => {
      getUserStub = sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            id: userId,
            team: {
              id: teamId,
              name: teamName,
            },
          },
        }))

      updateMottoStub = sinon.stub(robot.client, 'updateMotto').returns(Promise.resolve({ ok: true }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot us motto is ${motto}`)
    })

    it('should update the team motto', () => {
      expect(updateMottoStub).to.have.been.calledWith(motto, teamId, userId)
    })

    it('should tell the user the new motto', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot us motto is ${motto}`],
        ['hubot', `@${userName} So it is! As ${teamName} say: ${motto}`],
      ])
    })
  })
})
