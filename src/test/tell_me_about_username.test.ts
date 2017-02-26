import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import { SlackBotClient } from 'hubot-slack'
import { MemoryDataStore, User } from '@slack/client'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('@hubot tell me about @username', () => {

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

  describe('when user exists with team and a motto', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { id: queryUserId, name: queryUserName } = random.user()
    const { name: teamName } = random.team()
    const motto = random.motto()
    let getUserStub: sinon.SinonStub

    before(() => {
      getUserStub = sinon.stub(robot.client, 'getUser').returns(Promise.resolve({
        ok: true,
        user: {
          id: queryUserId,
          team: {
            id: 'some random id',
            name: teamName,
            motto: motto,
            members: [],
          },
        },
      }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(queryUserName)
        .returns({ id: queryUserId, name: queryUserName } as User)

      return room.user.say(userName, `@hubot tell me about @${queryUserName}`)
    })

    it('should fetch the user', () => {
      expect(getUserStub).to.have.been.calledWith(queryUserId)
    })

    it('should tell the user the user information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about @${queryUserName}`],
        ['hubot',
         `@${userName} "${queryUserName}" is a member of team: ${teamName},\r\n` +
         `They say: ${motto}`,
        ],
      ])
    })
  })

  describe('when user exists with team but no motto', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { id: queryUserId, name: queryUserName } = random.user()
    const { name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(queryUserId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            id: queryUserId,
            team: {
              id: 'some random id',
              name: teamName,
              motto: null,
              members: [],
            },
          },
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(queryUserName)
        .returns({ id: queryUserId, name: queryUserName } as User)

      return room.user.say(userName, `@hubot tell me about @${queryUserName}`)
    })

    it('should tell the user the user information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about @${queryUserName}`],
        ['hubot',
         `@${userName} "${queryUserName}" is a member of team: ${teamName},\r\n` +
         `They don't yet have a motto!`,
        ],
      ])
    })
  })

  describe('when user exists with no team', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { id: queryUserId, name: queryUserName } = random.user()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(queryUserId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            id: queryUserId,
            team: {},
          },
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(queryUserName)
        .returns({ id: queryUserId, name: queryUserName } as User)

      return room.user.say(userName, `@hubot tell me about @${queryUserName}`)
    })

    it('should tell the user the user information', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about @${queryUserName}`],
        ['hubot',
         `@${userName} "${queryUserName}" is not yet a member of a team!`,
        ],
      ])
    })
  })

  describe('when user is unknown by the API', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { id: queryUserId, name: queryUserName } = random.user()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(queryUserId)
        .returns(Promise.resolve({
          ok: false,
          statusCode: 404,
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(queryUserName)
        .returns({ id: queryUserId, name: queryUserName } as User)

      return room.user.say(userName, `@hubot tell me about @${queryUserName}`)
    })

    it('should tell the user that no such user exists', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about @${queryUserName}`],
        ['hubot',
         `@${userName} "${queryUserName}" is not a user I recognise!`,
        ],
      ])
    })
  })

  describe('when user is unknown by the brain', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { name: queryUserName } = random.user()

    before(() => {
      sinon.stub(dataStore, 'getUserByName')
        .withArgs(queryUserName)
        .returns(undefined)

      return room.user.say(userName, `@hubot tell me about @${queryUserName}`)
    })

    it('should tell the user that no such user exists', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about @${queryUserName}`],
        ['hubot',
         `@${userName} "${queryUserName}" is not a user I recognise!`,
        ],
      ])
    })
  })

  describe('when getUser errors', () => {

    before(setUp)
    after(tearDown)

    const { name: userName } = random.user()
    const { id: queryUserId, name: queryUserName } = random.user()

    before(() => {
      const error = new Error('[test] problem happened')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'getUser').returns(Promise.reject(error))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(queryUserName)
        .returns({ id: queryUserId, name: queryUserName } as User)

      return room.user.say(userName, `@hubot tell me about @${queryUserName}`)
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot tell me about @${queryUserName}`],
      ])
    })
  })

})
