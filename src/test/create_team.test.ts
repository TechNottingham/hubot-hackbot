import { expect } from 'chai'
import * as sinon from 'sinon'
import { RobotWithClient } from '../hackbot'
import { SlackBotClient } from 'hubot-slack'
import { MemoryDataStore, User } from '@slack/client'
import * as Helper from 'hubot-test-helper'
import * as random from './random'

describe('@hubot create team X', () => {

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

  describe('when user already exists and not in a team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()
    let getUserStub: sinon.SinonStub
    let createTeamStub: sinon.SinonStub

    before(() => {
      getUserStub = sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {},
          },
        }))

      createTeamStub = sinon.stub(robot.client, 'createTeam').returns(Promise.resolve({ ok: true }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should fetch the user', () => {
      expect(getUserStub).to.have.been.calledWith(userId)
    })

    it('should create the team', () => {
      expect(createTeamStub).to.have.been.calledWith(teamName, userId, userId)
    })

    it('should welcome the user to the team', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
        ['hubot', `@${userName} Welcome to team ${teamName}!`],
      ])
    })
  })

  describe('when user already exists and not a registered attendee', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {},
          },
        }))

      sinon.stub(robot.client, 'createTeam')
        .withArgs(teamName, userId, userId)
        .returns(Promise.resolve({
          ok: false,
          statusCode: 403,
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should reject the command', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
        ['hubot', `@${userName} Sorry, you don't have permission to create a team.`],
      ])
    })
  })

  describe('when user already exists and is already in a team', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()
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

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should tell the user that they cannot be in more than one team', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
        ['hubot', `@${userName} You're already a member of ${existingTeamName}!`],
      ])
    })
  })

  describe('when user already exists and team already exists', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()
    let getUserStub: sinon.SinonStub
    let createTeamStub: sinon.SinonStub

    before(() => {
      getUserStub = sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {},
          },
        }))

      createTeamStub = sinon.stub(robot.client, 'createTeam').returns(Promise.resolve({
        ok: false,
        statusCode: 409,
      }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should try to create the team', () => {
      expect(createTeamStub).to.have.been.calledWith(teamName, userId, userId)
    })

    it('should tell the user that the team already exists', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
        ['hubot', `@${userName} Sorry, but that team already exists!`],
      ])
    })
  })

  describe('when user does not already exist and team does not already exist', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()
    let createUserStub: sinon.SinonStub
    let createTeamStub: sinon.SinonStub

    before(() => {
      sinon.stub(robot.client, 'getUser').returns(Promise.resolve({
        ok: false,
        statusCode: 404,
      }))

      createUserStub = sinon.stub(robot.client, 'createUser').returns(Promise.resolve({ ok: true }))
      createTeamStub = sinon.stub(robot.client, 'createTeam').returns(Promise.resolve({ ok: true }))

      sinon.stub(dataStore, 'getUserByName').returns({ id: userId, name: userName } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should create the user', () => {
      expect(createUserStub).to.have.been.calledWith(userId, userName, userId)
    })

    it('should create the team', () => {
      expect(createTeamStub).to.have.been.calledWith(teamName, userId, userId)
    })

    it('should welcome the new user to the new team', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
        ['hubot', `@${userName} Welcome to team ${teamName}!`],
      ])
    })
  })

  describe('when user does not already exist and not a registered attendee', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: false,
          statusCode: 404,
        }))

      sinon.stub(robot.client, 'createUser')
        .withArgs(userId, userName, userId)
        .returns(Promise.resolve({
          ok: false,
          statusCode: 403,
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId, name: userName } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should reject the command', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
        ['hubot', `@${userName} Sorry, you don't have permission to create a team.`],
      ])
    })
  })

  describe('when user does not already exist and create user returns an unexpected code', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .withArgs(userId)
        .returns(Promise.resolve({
          ok: false,
          statusCode: 404,
        }))

      sinon.stub(robot.client, 'createUser')
        .withArgs(userId, userName, userId)
        .returns(Promise.resolve({
          ok: false,
          statusCode: 54,
        }))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userId, name: userName } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should tell the user that their user account could not be created', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
        ['hubot', `@${userName} Sorry, I can't create your user account :frowning:`],
      ])
    })
  })

  describe('when user does not already exist and creating the team returns an unexpected code', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getUser').returns(Promise.resolve({ ok: false, statusCode: 404 }))
      sinon.stub(robot.client, 'createUser').returns(Promise.resolve({ ok: true, statusCode: 201 }))
      sinon.stub(robot.client, 'createTeam').returns(Promise.resolve({ ok: false, statusCode: 503 }))
      sinon.stub(dataStore, 'getUserByName').returns({ id: userId } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should tell the user that the team could not be created', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
        ['hubot', `@${userName} Sorry, I can't create your team :frowning:`],
      ])
    })
  })

  describe('when user already exists and creating the team returns(an unexpected code', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()

    before(() => {
      sinon.stub(robot.client, 'getUser')
        .returns(Promise.resolve({
          ok: true,
          user: {
            team: {},
          },
        }))

      sinon.stub(robot.client, 'createTeam').returns(Promise.resolve({ ok: false, statusCode: 503 }))
      sinon.stub(dataStore, 'getUserByName').returns({ id: userId } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should tell the user that the team could not be created', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
        ['hubot', `@${userName} Sorry, I can't create your team :frowning:`],
      ])
    })
  })

  describe('when getUser fails', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()

    before(() => {
      const error = new Error('[test] when getUser fails')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'getUser').returns(Promise.reject(error))
      sinon.stub(dataStore, 'getUserByName').returns({ id: userId } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
      ])
    })
  })

  describe('when user does not exist and createUser fails', () => {

    before(setUp)
    after(tearDown)

    const { id: userId, name: userName } = random.user()
    const { name: teamName } = random.team()

    before(() => {
      const error = new Error('[test] when user does not exist and createUser fails')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'getUser').returns(Promise.resolve({ ok: false, statusCode: 404 }))
      sinon.stub(robot.client, 'createUser').returns(Promise.reject(error))
      sinon.stub(dataStore, 'getUserByName').returns({ id: userId } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
      ])
    })
  })

  describe('when created user and createTeam fails', () => {

    before(setUp)
    after(tearDown)

    let userName: string
    let teamName: string

    before(() => {
      userName = 'sarah'
      teamName = 'Rosie'
      const error = new Error('[test] when created user and createTeam fails')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'getUser').returns(Promise.resolve({ ok: true, user: { team: {} } }))
      sinon.stub(robot.client, 'createUser').returns({ ok: true })
      sinon.stub(robot.client, 'createTeam').returns(Promise.reject(error))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userName } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
      ])
    })
  })

  describe('when user already exists and createTeam fails', () => {

    before(setUp)
    after(tearDown)

    let userName: string
    let teamName: string

    before(() => {
      userName = 'sarah'
      teamName = 'Rosie'
      const error = new Error('[test] when user already exists and createTeam fails')

      sinon.stub(robot, 'emit')
      sinon.stub(robot.client, 'getUser').returns(Promise.resolve({ ok: true, user: { team: {} } }))
      sinon.stub(robot.client, 'createTeam').returns(Promise.reject(error))

      sinon.stub(dataStore, 'getUserByName')
        .withArgs(userName)
        .returns({ id: userName } as User)

      return room.user.say(userName, `@hubot create team ${teamName}`)
    })

    it('should not respond', () => {
      expect(room.messages).to.eql([
        [userName, `@hubot create team ${teamName}`],
      ])
    })
  })
})
