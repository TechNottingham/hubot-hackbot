import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import { SlackBotClient } from 'hubot-slack'
import { MemoryDataStore, User } from '@slack/client'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('@hubot leave my team', () => {

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

  describe('when in a team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: existingTeamId, name: existingTeamName } = random.team()
    let removeTeamMemberStub: sinon.SinonStub
    let removeTeamStub: sinon.SinonStub

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {
              id: existingTeamId,
              name: existingTeamName,
            },
          },
        }))

      removeTeamMemberStub = sinon.stub(robot.client, 'removeTeamMember').returns(Promise.resolve({ ok: true }))
      removeTeamStub = sinon.stub(robot.client, 'removeTeam').returns(Promise.resolve({ ok: false }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, '@hubot leave my team')
    })

    it('should remove the user from the team', () => {
      expect(removeTeamMemberStub).to.have.been.calledWith(existingTeamId, userId, userId)
    })

    it('should attempt to remove the team', () => {
      expect(removeTeamStub).to.have.been.calledWith(existingTeamId, userId)
    })

    it('should tell the user that they have left the team', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot leave my team'],
        ['hubot', `@${userName} OK, you've been removed from team "${existingTeamName}"`],
      ])
    })
  })

  describe('when in a team and only member of the team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: existingTeamId, name: existingTeamName } = random.team()
    let getUserStub: sinon.SinonStub
    let removeTeamMemberStub: sinon.SinonStub
    let removeTeamStub: sinon.SinonStub

    before(() => {
      getUserStub = sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {
              id: existingTeamId,
              name: existingTeamName,
            },
          },
        }))

      removeTeamMemberStub = sinon.stub(robot.client, 'removeTeamMember').returns(Promise.resolve({ ok: true }))
      removeTeamStub = sinon.stub(robot.client, 'removeTeam').returns(Promise.resolve({ ok: true }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, '@hubot leave my team')
    })

    it('should remove the user from the team', () => {
      expect(removeTeamMemberStub).to.have.been.calledWith(existingTeamId, userId, userId)
    })

    it('should remove the team', () => {
      expect(removeTeamStub).to.have.been.calledWith(existingTeamId, userId)
    })

    it('should tell the user that they have left the team and that the team has been deleted', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot leave my team'],
        ['hubot', `@${userName} OK, you've been removed from team "${existingTeamName}" and the team has been deleted.`],
      ])
    })
  })

  describe('when not a registered attendee', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { id: existingTeamId, name: existingTeamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {
              id: existingTeamId,
              name: existingTeamName,
            },
          },
        }))

      sinon.stub(robot.client, 'removeTeamMember').returns(Promise.resolve({
        ok: false,
        statusCode: 403,
      }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, '@hubot leave my team')
    })

    it('should tell the user that they have left the team', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot leave my team'],
        ['hubot', `@${userName} Sorry, you don't have permission to leave your team.`],
      ])
    })
  })

  describe('when not in a team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {
              id: undefined,
            },
          },
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, '@hubot leave my team')
    })

    it('should tell the user that they are not in a team', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot leave my team'],
        ['hubot', `@${userName} You're not in a team! :goberserk:`],
      ])
    })
  })

  describe('when user does not exist', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()

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

      return room.user.say(userName, '@hubot leave my team')
    })

    it('should tell the user that they are not in a team', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot leave my team'],
        ['hubot', `@${userName} You're not in a team! :goberserk:`],
      ])
    })
  })

  describe('when getUser fails', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()

    before(() => {
      const error = new Error('[test] when getUser fails')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'getUser').withArgs(userId).returns(Promise.reject(error))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, '@hubot leave my team')
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot leave my team'],
      ])
    })
  })

  describe('when removeTeamMember fails', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()

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

      return room.user.say(userName, '@hubot leave my team')
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, '@hubot leave my team'],
      ])
    })
  })
})
