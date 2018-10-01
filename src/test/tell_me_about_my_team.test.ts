import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import { SlackBotClient } from 'hubot-slack'
import { MemoryDataStore, User } from '@slack/client'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('@hubot tell me about my team', () => {

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

  describe('when in a team with a motto', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: secondTeamMember } = random.user()
    const { name: thirdTeamMember } = random.user()
    const { name: teamName } = random.team()
    const motto = random.motto()
    let getUserStub: sinon.SinonStub

    before(() => {
      getUserStub = sinon.stub(robot.client, 'getUser').returns(Promise.resolve({
        ok: true,
        user: {
          id: userId,
          team: {
            id: 'some team id',
            name: teamName,
            motto: motto,
            members: [{
              name: userName,
            }, {
              name: secondTeamMember,
            }, {
              name: thirdTeamMember,
            }],
          },
        },
      }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot tell me about my team`)
    })

    it('should fetch the user', () => {
      expect(getUserStub).to.have.been.calledWith(userId)
    })

    it('should tell the user the team information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about my team`],
        ['hubot',
          `@${userName} "${teamName}" has 3 members: ${userName},` +
          ` ${secondTeamMember}, ${thirdTeamMember}\r\nThey say: ${motto}`,
        ],
      ])
    })
  })

  describe('when in a team without a motto', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: secondTeamMember } = random.user()
    const { name: thirdTeamMember } = random.user()
    const { name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            id: userId,
            team: {
              id: 'johnny-fives',
              name: teamName,
              motto: null,
              members: [{
                name: userName,
              }, {
                name: secondTeamMember,
              }, {
                name: thirdTeamMember,
              }],
            },
          },
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot tell me about my team`)
    })

    it('should tell the user the team information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about my team`],
        ['hubot',
          `@${userName} "${teamName}" has 3 members: ${userName}, ${secondTeamMember}, ${thirdTeamMember}\r\n` +
          "They don't yet have a motto!",
        ],
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
            id: userId,
            team: {},
          },
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot tell me about my team`)
    })

    it('should tell the user that they are not in a team', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about my team`],
        ['hubot', `@${userName} You're not in a team! :goberserk:`],
      ])
    })
  })

  describe('when user is unknown', () => {

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

      return room.user.say(userName, `@hubot tell me about my team`)
    })

    it('should tell the user that they are not in a team', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about my team`],
        ['hubot', `@${userName} You're not in a team! :goberserk:`],
      ])
    })
  })

  describe('when getUser errors', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()

    before(() => {
      const error = new Error('[test] when getUser errors')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'getUser').withArgs(userId).returns(Promise.reject(error))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot tell me about my team`)
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about my team`],
      ])
    })
  })

  describe('Yorkshire folk', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: secondTeamMember } = random.user()
    const { name: thirdTeamMember } = random.user()
    const { name: teamName } = random.team()
    const motto = random.motto()
    let getUserStub: sinon.SinonStub

    before(() => {
      getUserStub = sinon.stub(robot.client, 'getUser').returns(Promise.resolve({
        ok: true,
        user: {
          id: userId,
          team: {
            id: 'some team id',
            name: teamName,
            motto: motto,
            members: [{
              name: userName,
            }, {
              name: secondTeamMember,
            }, {
              name: thirdTeamMember,
            }],
          },
        },
      }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot tell me about me team`)
    })

    it('should fetch the user', () => {
      expect(getUserStub).to.have.been.calledWith(userId)
    })

    it('should tell the user the team information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about me team`],
        ['hubot',
          `@${userName} "${teamName}" has 3 members: ${userName},` +
          ` ${secondTeamMember}, ${thirdTeamMember}\r\nThey say: ${motto}`,
        ],
      ])
    })
  })
})
