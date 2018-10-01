import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import { SlackBotClient } from 'hubot-slack'
import { MemoryDataStore, User } from '@slack/client'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('@hubot kick @username from my team', () => {

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

  describe('when in the same team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: otherUserId, name: otherUsername } = random.otheruser()
    const { id: teamId, name: teamName } = random.team()
    let removeTeamMemberStub: sinon.SinonStub

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {
              id: teamId,
              name: teamName,
            },
          },
        }))

      removeTeamMemberStub = sinon.stub(robot.client, 'removeTeamMember').returns(Promise.resolve({ ok: true }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(otherUsername)
        .returns({ id: otherUserId } as User)
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot kick @${otherUsername} from my team`)
    })

    it('should remove the user from the team', () => {
      expect(removeTeamMemberStub).to.have.been.calledWith(teamId, otherUserId, userId)
    })

    it('should tell the user that the command has completed', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot kick @${otherUsername} from my team`],
        ['hubot', `@${userName} Done!`],
      ])
    })
  })

  describe('when the current user is not in a team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: otherUsername } = random.otheruser()
    let removeTeamMemberSpy: sinon.SinonSpy

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {},
          },
        }))

      removeTeamMemberSpy = sinon.spy(robot.client, 'removeTeamMember')

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot kick @${otherUsername} from my team`)
    })

    it('should not remove the user from the team', () => {
      expect(removeTeamMemberSpy).to.not.have.been.called
    })

    it('should tell the user that the command has failed', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot kick @${otherUsername} from my team`],
        ['hubot', `@${userName} I would, but you're not in a team...`],
      ])
    })
  })

  describe('when the @username is not in the same team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: otherUserId, name: otherUsername } = random.otheruser()
    const { id: teamId, name: teamName } = random.team()
    let removeTeamMemberStub: sinon.SinonStub

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {
              id: teamId,
              name: teamName,
            },
          },
        }))

      removeTeamMemberStub = sinon.stub(robot.client, 'removeTeamMember').returns(Promise.resolve({ ok: false, statusCode: 400 }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(otherUsername)
        .returns({ id: otherUserId } as User)
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot kick @${otherUsername} from my team`)
    })

    it('should tell the user that the command has failed', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot kick @${otherUsername} from my team`],
        ['hubot', `@${userName} Sorry, I can't because @${otherUsername} is not in your team...`],
      ])
    })
  })

  describe('when user does not exist', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: otherUsername } = random.otheruser()

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

      return room.user.say(userName, `@hubot kick @${otherUsername} from my team`)
    })

    it('should tell the user that they are not in a team', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot kick @${otherUsername} from my team`],
        ['hubot', `@${userName} You're not in a team! :goberserk:`],
      ])
    })
  })

  describe('when getUser fails', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: otherUsername } = random.otheruser()

    before(() => {
      const error = new Error('[test] when getUser fails')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'getUser').withArgs(userId).returns(Promise.reject(error))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot kick @${otherUsername} from my team`)
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot kick @${otherUsername} from my team`],
      ])
    })
  })

  describe('when removeTeamMember fails', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: otherUsername } = random.otheruser()

    before(() => {
      const error = new Error('[test] when removeTeamMember fails')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: { id: 'teamid' },
          },
        }))

      sinon.stub(robot.client, 'removeTeamMember').returns(Promise.reject(error))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot kick @${otherUsername} from my team`)
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot kick @${otherUsername} from my team`],
      ])
    })
  })

  describe('Yorkshire folkd', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: otherUserId, name: otherUsername } = random.otheruser()
    const { id: teamId, name: teamName } = random.team()
    let removeTeamMemberStub: sinon.SinonStub

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {
              id: teamId,
              name: teamName,
            },
          },
        }))

      removeTeamMemberStub = sinon.stub(robot.client, 'removeTeamMember').returns(Promise.resolve({ ok: true }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(otherUsername)
        .returns({ id: otherUserId } as User)
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot kick @${otherUsername} from me team`)
    })

    it('should remove the user from the team', () => {
      expect(removeTeamMemberStub).to.have.been.calledWith(teamId, otherUserId, userId)
    })

    it('should tell the user that the command has completed', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot kick @${otherUsername} from me team`],
        ['hubot', `@${userName} Done!`],
      ])
    })
  })

})
